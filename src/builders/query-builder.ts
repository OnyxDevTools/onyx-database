// filename: src/builders/query-builder.ts
import type { IQueryBuilder, IConditionBuilder } from '../types/builders';
import type {
  QueryCondition,
  QueryCriteria,
  SelectQuery,
  UpdateQuery,
  QueryPage,
} from '../types/protocol';
import type { Sort, StreamAction } from '../types/common';
import { OnyxError } from '../errors/onyx-error';

/**
 * Internal adapter the QueryBuilder uses to execute operations.
 * The facade will provide an implementation backed by the HTTP client.
 */
export interface QueryExecutor {
  count(table: string, select: SelectQuery, partition?: string): Promise<number>;
  queryPage<T>(
    table: string,
    select: SelectQuery,
    opts: { pageSize?: number; nextPage?: string; partition?: string }
  ): Promise<QueryPage<T>>;
  update(table: string, update: UpdateQuery, partition?: string): Promise<unknown>;
  deleteByQuery(table: string, select: SelectQuery, partition?: string): Promise<unknown>;
  stream<T>(
    table: string,
    select: SelectQuery,
    includeQueryResults: boolean,
    keepAlive: boolean,
    handlers: {
      onItemAdded?: (e: T) => void;
      onItemUpdated?: (e: T) => void;
      onItemDeleted?: (e: T) => void;
      onItem?: (e: T | null, a: StreamAction) => void;
    }
  ): Promise<{ cancel: () => void }>;
}

/** Utility: convert input condition (builder or raw criteria) to a QueryCondition */
function toSingleCondition(criteria: QueryCriteria): QueryCondition {
  return { conditionType: 'SingleCondition', criteria };
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

/**
 * Generic, strictly-typed QueryBuilder implementation.
 * This class is framework-agnostic and calls a provided QueryExecutor to run operations.
 */
export class QueryBuilder<T = unknown> implements IQueryBuilder<T> {
  private readonly exec: QueryExecutor;
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

  constructor(executor: QueryExecutor, table: string | null) {
    this.exec = executor;
    this.table = table;
  }

  /** ----------------- private helpers ----------------- */
  private ensureTable(): string {
    if (!this.table) throw new Error('Table is not defined. Call from(<table>) first.');
    return this.table;
  }

  private toSelectQuery(): SelectQuery {
    return {
      type: 'SelectQuery',
      fields: this.fields,
      conditions: this.conditions,
      sort: this.sort,
      limit: this.limitValue,
      distinct: this.distinctValue,
      groupBy: this.groupByValues,
      partition: this.partitionValue ?? null,
      resolvers: this.resolvers,
    };
  }

  /** ----------------- IQueryBuilder API ----------------- */

  from(table: string): IQueryBuilder<T> {
    this.table = table;
    return this;
  }

  selectFields(fields: string[]): IQueryBuilder<T> {
    this.fields = Array.isArray(fields) && fields.length > 0 ? fields : null;
    return this;
  }

  resolve(values: string[] | string): IQueryBuilder<T> {
    this.resolvers = Array.isArray(values) ? values : [values];
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
    } else if (this.conditions.conditionType === 'CompoundCondition' && this.conditions.operator === 'AND') {
      this.conditions.conditions.push(c);
    } else {
      this.conditions = { conditionType: 'CompoundCondition', operator: 'AND', conditions: [this.conditions, c] };
    }
    return this;
  }

  or(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T> {
    const c = toCondition(condition);
    if (!this.conditions) {
      this.conditions = c;
    } else if (this.conditions.conditionType === 'CompoundCondition' && this.conditions.operator === 'OR') {
      this.conditions.conditions.push(c);
    } else {
      this.conditions = { conditionType: 'CompoundCondition', operator: 'OR', conditions: [this.conditions, c] };
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
    return this.exec.count(table, this.toSelectQuery(), this.partitionValue);
  }

  async page(options: { pageSize?: number; nextPage?: string } = {}): Promise<{ records: T[]; nextPage?: string | null }> {
    if (this.mode !== 'select') throw new Error('Cannot call page() in update mode.');
    const table = this.ensureTable();
    const final = {
      pageSize: this.pageSizeValue ?? options.pageSize,
      nextPage: this.nextPageValue ?? options.nextPage,
      partition: this.partitionValue,
    };
    return this.exec.queryPage<T>(table, this.toSelectQuery(), final);
  }

  async list(options: { pageSize?: number; nextPage?: string } = {}): Promise<T[]> {
    const pg = await this.page(options);
    return Array.isArray(pg.records) ? pg.records : [];
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
    return this.exec.deleteByQuery(table, this.toSelectQuery(), this.partitionValue);
  }

  async update(): Promise<unknown> {
    if (this.mode !== 'update') throw new Error('Call setUpdates(...) before update().');
    const table = this.ensureTable();
    const update: UpdateQuery = {
      type: 'UpdateQuery',
      conditions: this.conditions,
      updates: this.updates ?? {},
      sort: this.sort,
      limit: this.limitValue,
      partition: this.partitionValue ?? null,
    };
    return this.exec.update(table, update, this.partitionValue);
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

  async stream(includeQueryResults = true, keepAlive = false): Promise<{ cancel: () => void }> {
    if (this.mode !== 'select') throw new Error('Streaming is only applicable in select mode.');
    const table = this.ensureTable();
    return this.exec.stream<T>(table, this.toSelectQuery(), includeQueryResults, keepAlive, {
      onItemAdded: this.onItemAddedListener ?? undefined,
      onItemUpdated: this.onItemUpdatedListener ?? undefined,
      onItemDeleted: this.onItemDeletedListener ?? undefined,
      onItem: this.onItemListener ?? undefined,
    });
  }
}

export default QueryBuilder;
