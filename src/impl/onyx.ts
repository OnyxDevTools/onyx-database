// filename: src/impl/onyx.ts
import { resolveConfig, type ResolvedConfig } from '../config/chain';
import { HttpClient } from '../core/http';
import { openJsonLinesStream } from '../core/stream';

import type { OnyxFacade, IOnyxDatabase, OnyxConfig } from '../types/public';
import type {
  IQueryBuilder,
  ISaveBuilder,
  ICascadeBuilder,
  IConditionBuilder,
  ICascadeRelationshipBuilder,
} from '../types/builders';
import { QueryResults, QueryResultsPromise } from '../builders/query-results';
import type {
  QueryCriteria,
  QueryCondition,
  SelectQuery,
  UpdateQuery,
  QueryPage,
} from '../types/protocol';
import type { Sort, StreamAction, OnyxDocument, FetchImpl } from '../types/common';
import { normalizeCondition } from '../helpers/condition-normalizer';
import type {
  SchemaHistoryEntry,
  SchemaRevision,
  SchemaUpsertRequest,
  SchemaValidationResult,
  SecretMetadata,
  SecretRecord,
  SecretsListResponse,
  SecretSaveRequest,
} from '../types/public';
import { CascadeRelationshipBuilder } from '../builders/cascade-relationship-builder';
import { OnyxError } from '../errors/onyx-error';
import { OnyxHttpError } from '../errors/http-error';

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cachedCfg: { promise: Promise<ResolvedConfig>; expires: number } | null = null;

function resolveConfigWithCache(config?: OnyxConfig): Promise<ResolvedConfig> {
  const ttl = config?.ttl ?? DEFAULT_CACHE_TTL;
  const now = Date.now();
  if (cachedCfg && cachedCfg.expires > now) {
    return cachedCfg.promise;
  }
  const { ttl: _ttl, requestLoggingEnabled: _reqLog, responseLoggingEnabled: _resLog, ...rest } = config ?? {};
  void _ttl;
  void _reqLog;
  void _resLog;
  const promise = resolveConfig(rest);
  cachedCfg = { promise, expires: now + ttl };
  return promise;
}

function clearCacheConfig(): void {
  cachedCfg = null;
}

/** -------------------------
 * Internal helpers
 * --------------------------*/
function toSingleCondition(criteria: QueryCriteria): QueryCondition {
  return { conditionType: 'SingleCondition', criteria };
}

function flattenStrings(values: Array<string | string[]>): string[] {
  const flat: string[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      flat.push(...value);
    } else if (typeof value === 'string') {
      flat.push(value);
    }
  }
  return flat;
}

function toCondition(input: IConditionBuilder | QueryCriteria): QueryCondition {
  if (typeof (input as IConditionBuilder).toCondition === 'function') {
    return (input as IConditionBuilder).toCondition();
  }
  const c = input as QueryCriteria;
  if (c && typeof c.field === 'string' && typeof c.operator === 'string') {
    return toSingleCondition(c);
  }
  throw new Error('Invalid condition passed to builder.');
}

type SecretMetadataPayload = Omit<SecretMetadata, 'updatedAt'> & { updatedAt: string | Date };
type SecretRecordPayload = Omit<SecretRecord, 'updatedAt'> & { updatedAt: string | Date };
type SchemaRevisionPayload = Omit<SchemaRevision, 'meta'> & {
  meta?: {
    revisionId?: string;
    createdAt?: string | Date;
    publishedAt?: string | Date;
  };
  createdAt?: string | Date;
  publishedAt?: string | Date;
  revisionId?: string;
};
type SchemaRevisionPayloadWithEntityText = SchemaRevisionPayload & { entityText?: unknown };
type SchemaValidationPayload = SchemaValidationResult & { schema?: SchemaRevisionPayload };
type SchemaValidationPayloadWithEntityText = SchemaValidationPayload & {
  schema?: SchemaRevisionPayloadWithEntityText;
};

function serializeDates(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeDates);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeDates(v);
    }
    return out;
  }
  return value;
}

function stripEntityText<T extends Record<string, unknown>>(input: T): Omit<T, 'entityText'> {
  const { entityText, ...rest } = input;
  void entityText;
  return rest;
}

function normalizeSecretMetadata(input: SecretMetadataPayload): SecretMetadata {
  return { ...input, updatedAt: new Date(input.updatedAt) };
}

function normalizeSecretRecord(input: SecretRecordPayload): SecretRecord {
  return { ...input, updatedAt: new Date(input.updatedAt) };
}

function normalizeDate(value?: string | Date): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value;
  const ts = new Date(value);
  return Number.isNaN(ts.getTime()) ? undefined : ts;
}

function normalizeSchemaRevision(
  input: SchemaRevisionPayloadWithEntityText,
  fallbackDatabaseId: string,
): SchemaRevision {
  const { meta, createdAt, publishedAt, revisionId, entityText, ...rest } = input;
  void entityText;
  const mergedMeta = {
    revisionId: meta?.revisionId ?? revisionId,
    createdAt: normalizeDate(meta?.createdAt ?? createdAt),
    publishedAt: normalizeDate(meta?.publishedAt ?? publishedAt),
  };
  const cleanedMeta =
    mergedMeta.revisionId || mergedMeta.createdAt || mergedMeta.publishedAt ? mergedMeta : undefined;
  return {
    ...rest,
    databaseId: input.databaseId ?? fallbackDatabaseId,
    meta: cleanedMeta,
    entities: input.entities ?? [],
  };
}

/** -------------------------
 * Onyx Database Implementation
 * --------------------------*/
class OnyxDatabaseImpl<Schema = Record<string, unknown>> implements IOnyxDatabase<Schema> {
  private readonly cfgPromise: Promise<ResolvedConfig>;
  private resolved: ResolvedConfig | null = null;
  private http: HttpClient | null = null;
  private readonly streams = new Set<{ cancel: () => void }>();
  private readonly requestLoggingEnabled: boolean;
  private readonly responseLoggingEnabled: boolean;
  private readonly defaultPartition: string | undefined;

  constructor(config?: OnyxConfig) {
    // Defer resolution; keeps init() synchronous
    this.requestLoggingEnabled = !!config?.requestLoggingEnabled;
    this.responseLoggingEnabled = !!config?.responseLoggingEnabled;
    this.defaultPartition = config?.partition;
    this.cfgPromise = resolveConfigWithCache(config);
  }

  private async ensureClient(): Promise<{
    http: HttpClient;
    fetchImpl: FetchImpl;
    baseUrl: string;
    databaseId: string;
  }> {
    if (!this.resolved) {
      this.resolved = await this.cfgPromise;
    }
    if (!this.http) {
      this.http = new HttpClient({
        baseUrl: this.resolved.baseUrl,
        apiKey: this.resolved.apiKey,
        apiSecret: this.resolved.apiSecret,
        fetchImpl: this.resolved.fetch,
        requestLoggingEnabled: this.requestLoggingEnabled,
        responseLoggingEnabled: this.responseLoggingEnabled,
      });
    }
    return {
      http: this.http,
      fetchImpl: this.resolved.fetch,
      baseUrl: this.resolved.baseUrl,
      databaseId: this.resolved.databaseId,
    };
  }

  private registerStream(handle: { cancel: () => void }): { cancel: () => void } {
    this.streams.add(handle);
    return {
      cancel: () => {
        try {
          handle.cancel();
        } finally {
          this.streams.delete(handle);
        }
      },
    };
  }

  /** -------- IOnyxDatabase -------- */

  from<Table extends keyof Schema & string>(table: Table): IQueryBuilder<Schema[Table]> {
    return new QueryBuilderImpl<Schema[Table], Schema>(this, String(table), this.defaultPartition);
  }

  select(...fields: Array<string | string[]>): IQueryBuilder<Record<string, unknown>> {
    const qb = new QueryBuilderImpl<Record<string, unknown>, Schema>(
      this,
      null,
      this.defaultPartition,
    );
    qb.select(...fields);
    return qb;
  }

  cascade(...relationships: Array<string | string[]>): ICascadeBuilder<Schema> {
    const cb = new CascadeBuilderImpl<Schema>(this);
    return cb.cascade(...relationships);
  }

  cascadeBuilder(): ICascadeRelationshipBuilder {
    return new CascadeRelationshipBuilder();
  }

  // Overload: builder form
  save<Table extends keyof Schema & string>(table: Table): ISaveBuilder<Schema[Table]>;
  // Overload: direct form
  save<Table extends keyof Schema & string>(
    table: Table,
    entityOrEntities: Partial<Schema[Table]> | Array<Partial<Schema[Table]>>,
    options?: { relationships?: string[] },
  ): Promise<unknown>;
  // Impl
  save(
    table: string,
    entityOrEntities?: unknown,
    options?: { relationships?: string[] },
  ): ISaveBuilder<unknown> | Promise<unknown> {
    if (arguments.length === 1) {
      return new SaveBuilderImpl<unknown, Schema>(this, table);
    }
    return this._saveInternal(table, entityOrEntities as unknown, options);
  }

  async batchSave<Table extends keyof Schema & string>(
    table: Table,
    entities: Array<Partial<Schema[Table]>>,
    batchSize = 1000,
    options?: { relationships?: string[] },
  ): Promise<void> {
    for (let i = 0; i < entities.length; i += batchSize) {
      const chunk = entities.slice(i, i + batchSize);
      if (chunk.length) {
        await this._saveInternal(String(table), chunk, options);
      }
    }
  }

  async findById<Table extends keyof Schema & string, T = Schema[Table]>(
    table: Table,
    primaryKey: string,
    options?: { partition?: string; resolvers?: string[] },
  ): Promise<T | null> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    const partition = options?.partition ?? this.defaultPartition;
    if (partition) params.append('partition', partition);
    if (options?.resolvers?.length) params.append('resolvers', options.resolvers.join(','));

    const path = `/data/${encodeURIComponent(databaseId)}/${encodeURIComponent(
      String(table),
    )}/${encodeURIComponent(primaryKey)}${params.toString() ? `?${params.toString()}` : ''}`;
    try {
      return await http.request<T>('GET', path);
    } catch (err) {
      if (err instanceof OnyxHttpError && err.status === 404) return null;
      throw err;
    }
  }

  async delete<Table extends keyof Schema & string, T = Schema[Table]>(
    table: Table,
    primaryKey: string,
    options?: { partition?: string; relationships?: string[] },
  ): Promise<T> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    const partition = options?.partition ?? this.defaultPartition;
    if (partition) params.append('partition', partition);
    if (options?.relationships?.length) {
      params.append('relationships', options.relationships.map(encodeURIComponent).join(','));
    }
    const path = `/data/${encodeURIComponent(databaseId)}/${encodeURIComponent(
      table,
    )}/${encodeURIComponent(primaryKey)}${params.toString() ? `?${params.toString()}` : ''}`;
    return http.request<T>('DELETE', path);
  }

  async saveDocument(doc: OnyxDocument): Promise<unknown> {
    const { http, databaseId } = await this.ensureClient();
    const path = `/data/${encodeURIComponent(databaseId)}/document`;
    return http.request('PUT', path, serializeDates(doc));
  }

  async getDocument(
    documentId: string,
    options?: { width?: number; height?: number },
  ): Promise<unknown> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    if (options?.width != null) params.append('width', String(options.width));
    if (options?.height != null) params.append('height', String(options.height));
    const path = `/data/${encodeURIComponent(databaseId)}/document/${encodeURIComponent(
      documentId,
    )}${params.toString() ? `?${params.toString()}` : ''}`;
    return http.request('GET', path);
  }

  async deleteDocument(documentId: string): Promise<unknown> {
    const { http, databaseId } = await this.ensureClient();
    const path = `/data/${encodeURIComponent(databaseId)}/document/${encodeURIComponent(
      documentId,
    )}`;
    return http.request('DELETE', path);
  }

  async getSchema(options?: { tables?: string | string[] }): Promise<SchemaRevision> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    const tables = options?.tables;
    const tableList = Array.isArray(tables)
      ? tables
      : typeof tables === 'string'
        ? tables.split(',')
        : [];
    const normalizedTables = tableList.map((t) => t.trim()).filter(Boolean);
    if (normalizedTables.length) {
      params.append('tables', normalizedTables.map(encodeURIComponent).join(','));
    }
    const path = `/schemas/${encodeURIComponent(databaseId)}${
      params.size ? `?${params.toString()}` : ''
    }`;
    const res = await http.request<SchemaRevisionPayloadWithEntityText>('GET', path);
    return normalizeSchemaRevision(res, databaseId);
  }

  async getSchemaHistory(): Promise<SchemaHistoryEntry[]> {
    const { http, databaseId } = await this.ensureClient();
    const path = `/schemas/history/${encodeURIComponent(databaseId)}`;
    const res = await http.request<SchemaRevisionPayloadWithEntityText[]>('GET', path);
    return Array.isArray(res) ? res.map((entry) => normalizeSchemaRevision(entry, databaseId)) : [];
  }

  async updateSchema(
    schema: SchemaUpsertRequest,
    options?: { publish?: boolean },
  ): Promise<SchemaRevision> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    if (options?.publish) params.append('publish', 'true');
    const path = `/schemas/${encodeURIComponent(databaseId)}${
      params.size ? `?${params.toString()}` : ''
    }`;
    const body = stripEntityText({ ...schema, databaseId: schema.databaseId ?? databaseId });
    const res = await http.request<SchemaRevisionPayloadWithEntityText>(
      'PUT',
      path,
      serializeDates(body),
    );
    return normalizeSchemaRevision(res, databaseId);
  }

  async validateSchema(schema: SchemaUpsertRequest): Promise<SchemaValidationResult> {
    const { http, databaseId } = await this.ensureClient();
    const path = `/schemas/${encodeURIComponent(databaseId)}/validate`;
    const body = stripEntityText({ ...schema, databaseId: schema.databaseId ?? databaseId });
    const res = await http.request<SchemaValidationPayloadWithEntityText>(
      'POST',
      path,
      serializeDates(body),
    );
    const normalizedSchema = res.schema
      ? normalizeSchemaRevision(res.schema, databaseId)
      : undefined;
    return {
      ...res,
      valid: res.valid ?? true,
      schema: normalizedSchema,
    };
  }

  async listSecrets(): Promise<SecretsListResponse> {
    const { http, databaseId } = await this.ensureClient();
    const path = `/database/${encodeURIComponent(databaseId)}/secret`;
    const response = await http.request<SecretsListResponse & { records: SecretMetadataPayload[] }>(
      'GET',
      path,
      undefined,
      { 'Content-Type': 'application/json' },
    );
    const records = (response.records ?? []).map(normalizeSecretMetadata);
    return {
      ...response,
      records,
      meta: response.meta ?? { totalRecords: records.length },
    };
  }

  async getSecret(key: string): Promise<SecretRecord> {
    const { http, databaseId } = await this.ensureClient();
    const path = `/database/${encodeURIComponent(databaseId)}/secret/${encodeURIComponent(key)}`;
    const record = await http.request<SecretRecordPayload>('GET', path, undefined, {
      'Content-Type': 'application/json',
    });
    return normalizeSecretRecord(record);
  }

  async putSecret(key: string, input: SecretSaveRequest): Promise<SecretMetadata> {
    const { http, databaseId } = await this.ensureClient();
    const path = `/database/${encodeURIComponent(databaseId)}/secret/${encodeURIComponent(key)}`;
    const response = await http.request<SecretMetadataPayload>('PUT', path, serializeDates(input));
    return normalizeSecretMetadata(response);
  }

  async deleteSecret(key: string): Promise<{ key: string }> {
    const { http, databaseId } = await this.ensureClient();
    const path = `/database/${encodeURIComponent(databaseId)}/secret/${encodeURIComponent(key)}`;
    const response = await http.request<{ key?: string } | { success?: boolean } | undefined>(
      'DELETE',
      path,
    );
    const deletedKey =
      response && typeof response === 'object' && 'key' in response
        ? (response as { key?: string }).key
        : undefined;
    return { key: deletedKey ?? key };
  }

  close(): void {
    for (const h of Array.from(this.streams)) {
      try {
        h.cancel();
      } catch {
        /* ignore */
      } finally {
        this.streams.delete(h);
      }
    }
  }

  /** -------- internal helpers used by builders -------- */

  async _count(table: string, select: SelectQuery, partition?: string): Promise<number> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    const p = partition ?? this.defaultPartition;
    if (p) params.append('partition', p);
    const path = `/data/${encodeURIComponent(databaseId)}/query/count/${encodeURIComponent(
      table,
    )}${params.toString() ? `?${params.toString()}` : ''}`;
    return http.request<number>('PUT', path, serializeDates(select));
  }

  async _queryPage<T>(
    table: string,
    select: SelectQuery,
    opts: { pageSize?: number; nextPage?: string; partition?: string } = {},
  ): Promise<QueryPage<T>> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    if (opts.pageSize != null) params.append('pageSize', String(opts.pageSize));
    if (opts.nextPage) params.append('nextPage', opts.nextPage);
    const p = opts.partition ?? this.defaultPartition;
    if (p) params.append('partition', p);
    const path = `/data/${encodeURIComponent(databaseId)}/query/${encodeURIComponent(
      table,
    )}${params.toString() ? `?${params.toString()}` : ''}`;
    return http.request<QueryPage<T>>('PUT', path, serializeDates(select));
  }

  async _update(table: string, update: UpdateQuery, partition?: string): Promise<unknown> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    const p = partition ?? this.defaultPartition;
    if (p) params.append('partition', p);
    const path = `/data/${encodeURIComponent(databaseId)}/query/update/${encodeURIComponent(
      table,
    )}${params.toString() ? `?${params.toString()}` : ''}`;
    return http.request('PUT', path, serializeDates(update));
  }

  async _deleteByQuery(table: string, select: SelectQuery, partition?: string): Promise<unknown> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    const p = partition ?? this.defaultPartition;
    if (p) params.append('partition', p);
    const path = `/data/${encodeURIComponent(databaseId)}/query/delete/${encodeURIComponent(
      table,
    )}${params.toString() ? `?${params.toString()}` : ''}`;
    return http.request('PUT', path, serializeDates(select));
  }

  async _stream<T>(
    table: string,
    select: SelectQuery,
    includeQueryResults: boolean,
    keepAlive: boolean,
    handlers: {
      onItemAdded?: (e: T) => void;
      onItemUpdated?: (e: T) => void;
      onItemDeleted?: (e: T) => void;
      onItem?: (e: T | null, a: StreamAction) => void;
    },
  ): Promise<{ cancel: () => void }> {
    const { http, baseUrl, databaseId, fetchImpl } = await this.ensureClient();
    const params = new URLSearchParams();
    if (includeQueryResults) params.append('includeQueryResults', 'true');
    if (keepAlive) params.append('keepAlive', 'true');

    const url = `${baseUrl}/data/${encodeURIComponent(databaseId)}/query/stream/${encodeURIComponent(
      table,
    )}${params.toString() ? `?${params.toString()}` : ''}`;
    const handle = await openJsonLinesStream<T>(
      fetchImpl,
      url,
      {
        method: 'PUT',
        headers: http.headers({
          Accept: 'application/x-ndjson',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(serializeDates(select)),
      },
      handlers,
    );
    return this.registerStream(handle);
  }

  async _saveInternal(
    table: string,
    entityOrEntities: unknown,
    options?: { relationships?: string[] },
  ): Promise<unknown> {
    const { http, databaseId } = await this.ensureClient();
    const params = new URLSearchParams();
    if (options?.relationships?.length) {
      params.append('relationships', options.relationships.map(encodeURIComponent).join(','));
    }
    const path = `/data/${encodeURIComponent(databaseId)}/${encodeURIComponent(table)}${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    return http.request('PUT', path, serializeDates(entityOrEntities));
  }
}

/** -------------------------
 * QueryBuilder Implementation
 * --------------------------*/
class QueryBuilderImpl<T = unknown, S = Record<string, unknown>> implements IQueryBuilder<T> {
  private readonly db: OnyxDatabaseImpl<S>;
  private table: string | null;

  private fields: string[] | null = null;
  private resolvers: string[] | null = null;
  private conditions: QueryCondition | null = null;
  private sort: Sort[] | null = null;
  private limitValue: number | null = null;
  private distinctValue = false;
  private groupByValues: string[] | null = null;
  private partitionValue: string | undefined;

  private pageSizeValue: number | null = null;
  private nextPageValue: string | null = null;

  private mode: 'select' | 'update' = 'select';
  private updates: Partial<T> | null = null;

  private onItemAddedListener: ((e: T) => void) | null = null;
  private onItemUpdatedListener: ((e: T) => void) | null = null;
  private onItemDeletedListener: ((e: T) => void) | null = null;
  private onItemListener: ((e: T | null, a: StreamAction) => void) | null = null;

  constructor(db: OnyxDatabaseImpl<S>, table: string | null, partition?: string) {
    this.db = db;
    this.table = table;
    this.partitionValue = partition;
  }

  private ensureTable(): string {
    if (!this.table) throw new Error('Table is not defined. Call from(<table>) first.');
    return this.table;
  }

  private serializableConditions(): QueryCondition | null {
    return normalizeCondition(this.conditions);
  }

  private toSelectQuery(): SelectQuery {
    return {
      type: 'SelectQuery',
      fields: this.fields,
      conditions: this.serializableConditions(),
      sort: this.sort,
      limit: this.limitValue,
      distinct: this.distinctValue,
      groupBy: this.groupByValues,
      partition: this.partitionValue ?? null,
      resolvers: this.resolvers,
    };
  }

  private toUpdateQuery(): UpdateQuery {
    return {
      type: 'UpdateQuery',
      conditions: this.serializableConditions(),
      updates: this.updates ?? {},
      sort: this.sort,
      limit: this.limitValue,
      partition: this.partitionValue ?? null,
    };
  }

  private toSerializableQueryObject(): (SelectQuery | UpdateQuery) & { table: string } {
    const table = this.ensureTable();
    const payload = this.mode === 'update' ? this.toUpdateQuery() : this.toSelectQuery();
    return { ...payload, table };
  }

  from(table: string): IQueryBuilder<T> {
    this.table = table;
    return this;
  }

  select(...fields: Array<string | string[]>): IQueryBuilder<T> {
    const flat = flattenStrings(fields);
    this.fields = flat.length > 0 ? flat : null;
    return this;
  }

  resolve(...values: Array<string | string[]>): IQueryBuilder<T> {
    const flat = flattenStrings(values);
    this.resolvers = flat.length > 0 ? flat : null;
    return this;
  }

  where(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T> {
    const c = toCondition(condition);
    if (!this.conditions) {
      this.conditions = c;
    } else {
      this.conditions = {
        conditionType: 'CompoundCondition',
        operator: 'AND',
        conditions: [this.conditions, c],
      };
    }
    return this;
  }

  and(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T> {
    const c = toCondition(condition);
    if (!this.conditions) {
      this.conditions = c;
    } else if (
      this.conditions.conditionType === 'CompoundCondition' &&
      this.conditions.operator === 'AND'
    ) {
      this.conditions.conditions.push(c);
    } else {
      this.conditions = {
        conditionType: 'CompoundCondition',
        operator: 'AND',
        conditions: [this.conditions, c],
      };
    }
    return this;
  }

  or(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T> {
    const c = toCondition(condition);
    if (!this.conditions) {
      this.conditions = c;
    } else if (
      this.conditions.conditionType === 'CompoundCondition' &&
      this.conditions.operator === 'OR'
    ) {
      this.conditions.conditions.push(c);
    } else {
      this.conditions = {
        conditionType: 'CompoundCondition',
        operator: 'OR',
        conditions: [this.conditions, c],
      };
    }
    return this;
  }

  orderBy(...sorts: Sort[]): IQueryBuilder<T> {
    this.sort = sorts;
    return this;
  }

  groupBy(...fields: string[]): IQueryBuilder<T> {
    this.groupByValues = fields.length ? fields : null;
    return this;
  }

  distinct(): IQueryBuilder<T> {
    this.distinctValue = true;
    return this;
  }

  limit(n: number): IQueryBuilder<T> {
    this.limitValue = n;
    return this;
  }

  inPartition(partition: string): IQueryBuilder<T> {
    this.partitionValue = partition;
    return this;
  }

  pageSize(n: number): IQueryBuilder<T> {
    this.pageSizeValue = n;
    return this;
  }

  nextPage(token: string): IQueryBuilder<T> {
    this.nextPageValue = token;
    return this;
  }

  setUpdates(updates: Partial<T>): IQueryBuilder<T> {
    this.mode = 'update';
    this.updates = updates;
    return this;
  }

  async count(): Promise<number> {
    if (this.mode !== 'select') throw new Error('Cannot call count() in update mode.');
    const table = this.ensureTable();
    return this.db._count(table, this.toSelectQuery(), this.partitionValue);
  }

  async page(
    options: { pageSize?: number; nextPage?: string } = {},
  ): Promise<{ records: T[]; nextPage?: string | null }> {
    if (this.mode !== 'select') throw new Error('Cannot call page() in update mode.');
    const table = this.ensureTable();
    const final = {
      pageSize: this.pageSizeValue ?? options.pageSize,
      nextPage: this.nextPageValue ?? options.nextPage,
      partition: this.partitionValue,
    };
    return this.db._queryPage<T>(table, this.toSelectQuery(), final);
  }

  list(options: {
    pageSize?: number;
    nextPage?: string;
  } = {}): QueryResultsPromise<T> {
    const size = this.pageSizeValue ?? options.pageSize;
    const pgPromise = this.page(options).then(pg => {
      const fetcher = (token: string) => this.nextPage(token).list({ pageSize: size });
      return new QueryResults<T>(Array.isArray(pg.records) ? pg.records : [], pg.nextPage ?? null, fetcher);
    });
    for (const m of Object.getOwnPropertyNames(QueryResults.prototype) as string[]) {
      if (m === 'constructor') continue;
      (pgPromise as any)[m] = (...args: any[]) => pgPromise.then(res => (res as any)[m](...args));
    }
    return pgPromise as QueryResultsPromise<T>;
  }

  async firstOrNull(): Promise<T | null> {
    if (this.mode !== 'select') throw new Error('Cannot call firstOrNull() in update mode.');
    if (!this.conditions) throw new OnyxError('firstOrNull() requires a where() clause.');
    this.limitValue = 1;
    const pg = await this.page();
    return Array.isArray(pg.records) && pg.records.length > 0 ? pg.records[0] : null;
  }

  async one(): Promise<T | null> {
    return this.firstOrNull();
  }

  async delete(): Promise<unknown> {
    if (this.mode !== 'select') throw new Error('delete() is only applicable in select mode.');
    const table = this.ensureTable();
    return this.db._deleteByQuery(table, this.toSelectQuery(), this.partitionValue);
  }

  async update(): Promise<unknown> {
    if (this.mode !== 'update') throw new Error('Call setUpdates(...) before update().');
    const table = this.ensureTable();
    const update = this.toUpdateQuery();
    return this.db._update(table, update, this.partitionValue);
  }

  onItemAdded(listener: (entity: T) => void): IQueryBuilder<T> {
    this.onItemAddedListener = listener;
    return this;
  }

  onItemUpdated(listener: (entity: T) => void): IQueryBuilder<T> {
    this.onItemUpdatedListener = listener;
    return this;
  }

  onItemDeleted(listener: (entity: T) => void): IQueryBuilder<T> {
    this.onItemDeletedListener = listener;
    return this;
  }

  onItem(listener: (entity: T | null, action: StreamAction) => void): IQueryBuilder<T> {
    this.onItemListener = listener;
    return this;
  }

  async streamEventsOnly(keepAlive = true): Promise<{ cancel: () => void }> {
    return this.stream(false, keepAlive);
  }

  async streamWithQueryResults(keepAlive = false): Promise<{ cancel: () => void }> {
    return this.stream(true, keepAlive);
  }

  async stream(includeQueryResults = true, keepAlive = false): Promise<{ cancel: () => void }> {
    if (this.mode !== 'select') throw new Error('Streaming is only applicable in select mode.');
    const table = this.ensureTable();
    return this.db._stream<T>(table, this.toSelectQuery(), includeQueryResults, keepAlive, {
      onItemAdded: this.onItemAddedListener ?? undefined,
      onItemUpdated: this.onItemUpdatedListener ?? undefined,
      onItemDeleted: this.onItemDeletedListener ?? undefined,
      onItem: this.onItemListener ?? undefined,
    });
  }
}

/** -------------------------
 * SaveBuilder Implementation
 * --------------------------*/
class SaveBuilderImpl<T = unknown, S = Record<string, unknown>> implements ISaveBuilder<T> {
  private readonly db: OnyxDatabaseImpl<S>;
  private readonly table: string;
  private relationships: string[] | null = null;

  constructor(db: OnyxDatabaseImpl<S>, table: string) {
    this.db = db;
    this.table = table;
  }

  cascade(...relationships: Array<string | string[]>): ISaveBuilder<T> {
    this.relationships = relationships.flat();
    return this;
  }

  one(entity: Partial<T>): Promise<unknown> {
    const opts = this.relationships ? { relationships: this.relationships } : undefined;
    return this.db._saveInternal(this.table, entity, opts);
  }

  many(entities: Array<Partial<T>>): Promise<unknown> {
    const opts = this.relationships ? { relationships: this.relationships } : undefined;
    return this.db._saveInternal(this.table, entities, opts);
  }
}

/** -------------------------
 * CascadeBuilder Implementation
 * --------------------------*/
class CascadeBuilderImpl<Schema = Record<string, unknown>>
  implements ICascadeBuilder<Schema>
{
  private readonly db: OnyxDatabaseImpl<Schema>;
  private rels: string[] | null = null;

  constructor(db: OnyxDatabaseImpl<Schema>) {
    this.db = db;
  }

  cascade(...relationships: Array<string | string[]>): ICascadeBuilder<Schema> {
    this.rels = relationships.flat();
    return this;
  }

  save<Table extends keyof Schema & string>(
    table: Table,
    entityOrEntities: Partial<Schema[Table]> | Array<Partial<Schema[Table]>>,
  ): Promise<unknown> {
    const opts = this.rels ? { relationships: this.rels } : undefined;
    return this.db._saveInternal(String(table), entityOrEntities, opts);
  }

  delete<Table extends keyof Schema & string>(
    table: Table,
    primaryKey: string,
  ): Promise<Schema[Table]> {
    const opts = this.rels ? { relationships: this.rels } : undefined;
    return this.db.delete(table, primaryKey, opts);
  }
}

/** -------------------------
 * Facade export
 * --------------------------*/
export const onyx: OnyxFacade = {
  init<Schema = Record<string, unknown>>(config?: OnyxConfig): IOnyxDatabase<Schema> {
    return new OnyxDatabaseImpl<Schema>(config);
  },
  clearCacheConfig,
};
