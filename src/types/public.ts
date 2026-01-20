// filename: src/types/public.ts
import type { OnyxDocument, FetchImpl, FullTextQuery } from './common';
import type {
  IQueryBuilder,
  ICascadeBuilder,
  ISaveBuilder,
  ICascadeRelationshipBuilder,
  QueryResults,
  QueryResultsPromise,
} from './builders';

export type { QueryResults, QueryResultsPromise, FullTextQuery };

export interface RetryOptions {
  /**
   * Enable or disable HTTP retries for idempotent GET requests. Defaults to `true`.
   */
  enabled?: boolean;
  /**
   * Maximum number of retry attempts after the initial GET request. Defaults to 3.
   */
  maxRetries?: number;
  /**
   * Initial backoff delay in milliseconds. Defaults to 300ms and grows with Fibonacci backoff.
   */
  initialDelayMs?: number;
}

export interface OnyxConfig {
  baseUrl?: string;
  databaseId?: string;
  apiKey?: string;
  apiSecret?: string;
  fetch?: FetchImpl;
  /**
   * Default partition for queries, `findById`, and deletes when removing by
   * primary key. Saves rely on the entity's partition field instead.
   */
  partition?: string;
  /**
   * When true, log HTTP requests and bodies to the console.
   */
  requestLoggingEnabled?: boolean;
  /**
   * When true, log HTTP responses and bodies to the console.
   */
  responseLoggingEnabled?: boolean;
  /**
   * Milliseconds to cache resolved credentials; defaults to 5 minutes.
   */
  ttl?: number;
  /**
   * Retry configuration for idempotent GET requests.
   */
  retry?: RetryOptions;
}

export interface IOnyxDatabase<Schema = Record<string, unknown>> {
  /**
   * Begin a query against a table.
   *
   * @example
   * ```ts
   * const maybeUser = await db
   *   .from('User')
   *   .where(eq('email', 'a@b.com'))
   *   .firstOrNull(); // or .one()
   * ```
   *
   * @example
   * ```ts
   * const users = await db
   *   .select('id', 'email')
   *   .from('User')
   *   .list();
   * ```
   *
   * @param table Table name to query.
   */
  from<Table extends keyof Schema & string>(table: Table): IQueryBuilder<Schema[Table]>;

  /**
   * Select specific fields for a query.
   *
   * @example
   * ```ts
   * const users = await db
   *   .select('id', 'name')
   *   .from('User')
   *   .list();
   * ```
   *
   * @param fields Field names to project; omit to select all.
   */
  select(...fields: string[]): IQueryBuilder<Record<string, unknown>>;

  /**
   * Run a Lucene full-text search across all tables.
   *
   * @example
   * ```ts
   * const results = await db.search('hello world', 4.4).list();
   * ```
   *
   * @param queryText Text to match against `__full_text__`.
   * @param minScore Optional minimum score; serialized as `null` when omitted.
   */
  search(queryText: string, minScore?: number | null): IQueryBuilder<Record<string, unknown>>;

  /**
   * Include related records in the next save or delete.
   *
   * @example
   * ```ts
   * // Save a role and its permissions
   * await db
   *   .cascade('permissions:Permission(roleId, id)')
   *   .save('Role', role);
   *
   * // Delete a role and all of its permissions via resolver
   * await db
   *   .cascade('permissions')
   *   .delete('Role', 'admin');
   * ```
   *
   * @param relationships Cascade relationship strings using
   * `graph:Type(targetField, sourceField)` syntax when saving.
   * When deleting, pass resolver attribute names only.
   */
  cascade(...relationships: Array<string | string[]>): ICascadeBuilder<Schema>;

  /**
   * Build cascade relationship strings programmatically.
   *
   * @example
   * ```ts
   * const rel = db
   *   .cascadeBuilder()
   *   .graph('permissions')
   *   .graphType('Permission')
   *   .targetField('roleId')
   *   .sourceField('id');
   * await db.cascade(rel).save('Role', role);
   * ```
   *
   * @returns Builder that emits strings like
   * `graphName:TypeName(targetField, sourceField)`.
   */
  cascadeBuilder(): ICascadeRelationshipBuilder;

  /**
   * Start a save builder for inserting or updating entities.
   *
   * @example
   * ```ts
   * await db
   *   .save('User')
   *   .cascade('role:Role(userId, id)')
   *   .one({
   *     id: 'u1',
   *     email: 'a@b.com',
   *     role: { id: 'admin', userId: 'u1' }
   *   });
   * ```
   *
   * @param table Table to save into.
   */
  save<Table extends keyof Schema & string>(table: Table): ISaveBuilder<Schema[Table]>;

  /**
   * Save one or many entities immediately.
   *
   * @example
   * ```ts
   * await db.save(
   *   'Role',
   *   [{ id: 'admin', permissions: [{ id: 'perm1', roleId: 'admin' }] }],
   *   { relationships: ['permissions:Permission(roleId, id)'] }
   * );
   * ```
   *
   * The `relationships` option accepts cascade strings in the form
   * `graphName:TypeName(targetField, sourceField)` describing how child records relate to the
   * parent. Use {@link cascadeBuilder} to construct them safely.
   *
   * @param table Table to save into.
   * @param entityOrEntities Object or array of objects to persist.
   * @param options Optional settings for the save operation.
   * @param options.relationships Cascade relationships to include.
   */
  save<Table extends keyof Schema & string>(
    table: Table,
    entityOrEntities: Partial<Schema[Table]> | Array<Partial<Schema[Table]>>,
    options?: { relationships?: string[] }
  ): Promise<unknown>;

  /**
   * Save many entities in configurable batches.
   *
   * @example
   * ```ts
   * await db.batchSave('User', users, 500);
   * ```
   *
   * @param table Table to save into.
   * @param entities Array of entities to persist.
   * @param batchSize Number of entities per batch; defaults to 1000.
   */
  batchSave<Table extends keyof Schema & string>(
    table: Table,
    entities: Array<Partial<Schema[Table]>>,
    batchSize?: number,
    options?: { relationships?: string[] }
  ): Promise<void>;

  /**
   * Retrieve an entity by its primary key.
   *
   * @example
   * ```ts
   * const user = await db.findById('User', 'user_1', {
   *   partition: 'tenantA',
   *   resolvers: ['profile']
   * });
   * ```
   *
   * @param table Table to search.
   * @param primaryKey Primary key value.
   * @param options Optional partition and resolver settings.
   */
  findById<Table extends keyof Schema & string, T = Schema[Table]>(
    table: Table,
    primaryKey: string,
    options?: { partition?: string; resolvers?: string[] }
  ): Promise<T | null>;

  /**
   * Delete an entity by primary key.
   *
   * @example
   * ```ts
   * const deleted = await db.delete('Role', 'admin', {
   *   relationships: ['permissions']
   * });
   * ```
   *
   * @param table Table containing the entity.
   * @param primaryKey Primary key value.
   * @param options Optional partition and cascade relationships.
   * @returns `true` when the delete request succeeds.
   */
  delete<Table extends keyof Schema & string>(
    table: Table,
    primaryKey: string,
    options?: { partition?: string; relationships?: string[] }
  ): Promise<boolean>;

  /**
   * Store a document (file blob) for later retrieval.
   *
   * @example
   * ```ts
   * const id = await db.saveDocument({
   *   path: '/docs/note.txt',
   *   mimeType: 'text/plain',
   *   content: 'hello world'
   * });
   * ```
   */
  saveDocument(doc: OnyxDocument): Promise<unknown>;

  /**
   * Fetch a previously saved document.
   *
   * @example
   * ```ts
   * const doc = await db.getDocument('doc123', { width: 640, height: 480 });
   * ```
   *
   * @param documentId ID of the document to fetch.
   * @param options Optional image resize settings.
   */
  getDocument(documentId: string, options?: { width?: number; height?: number }): Promise<unknown>;

  /**
   * Remove a stored document permanently.
   *
   * @example
   * ```ts
   * await db.deleteDocument('doc123');
   * ```
   *
   * @param documentId ID of the document to delete.
  */
  deleteDocument(documentId: string): Promise<unknown>;

  /**
   * Fetch the current schema for the configured database.
   *
   * @example
   * ```ts
   * const schema = await db.getSchema();
   * const userOnly = await db.getSchema({ tables: ['User'] });
   * ```
   */
  getSchema(options?: { tables?: string | string[] }): Promise<SchemaRevision>;

  /**
   * Retrieve the schema revision history for the configured database.
   */
  getSchemaHistory(): Promise<SchemaHistoryEntry[]>;

  /**
   * Compare the current API schema with a local schema definition.
   *
   * @example
   * ```ts
   * const diff = await db.diffSchema(localSchema);
   * if (!diff.newTables.length && !diff.removedTables.length && !diff.changedTables.length) {
   *   console.log('Schemas match');
   * }
   * ```
   */
  diffSchema(localSchema: SchemaUpsertRequest): Promise<SchemaDiff>;

  /**
   * Update the schema for the configured database.
   *
   * @example
   * ```ts
   * await db.updateSchema({
   *   revisionDescription: 'Add profile table',
   *   entities: [
   *     {
   *       name: 'Profile',
   *       identifier: { name: 'id', generator: 'UUID' },
   *       attributes: [
   *         { name: 'displayName', type: 'String', isNullable: false }
   *       ]
   *     }
   *   ]
   * }, { publish: true });
   * ```
   */
  updateSchema(schema: SchemaUpsertRequest, options?: { publish?: boolean }): Promise<SchemaRevision>;

  /**
   * Validate a schema definition without applying it to the database.
   */
  validateSchema(schema: SchemaUpsertRequest): Promise<SchemaValidationResult>;

  /**
   * List stored secrets for the configured database.
   */
  listSecrets(): Promise<SecretsListResponse>;

  /**
   * Fetch a decrypted secret value by key.
   */
  getSecret(key: string): Promise<SecretRecord>;

  /**
   * Create or update a secret.
   */
  putSecret(key: string, input: SecretSaveRequest): Promise<SecretMetadata>;

  /**
   * Delete a secret by key.
   */
  deleteSecret(key: string): Promise<{ key: string }>;

  /**
   * Cancels active streams; safe to call multiple times.
   * @example
   * ```ts
   * const stream = await db.from('User').stream();
   * stream.cancel();
   * db.close();
   * ```
   */
  close(): void;
}

export interface OnyxFacade {
  /**
  * Initialize a database client.
  *
  * @example
   * ```ts
   * const db = onyx.init({
   *   baseUrl: 'https://api.onyx.dev',
   *   databaseId: 'my-db',
   *   apiKey: 'key',
   *   apiSecret: 'secret'
   * });
   * ```
   *
   * @param config Connection settings and optional custom fetch.
   * @remarks
   * Each `db` instance resolves configuration once and holds a single internal
   * HTTP client. Requests leverage Node's built-in `fetch`, which reuses and
  * pools connections for keep-alive, so additional connection caching or
  * pooling is rarely necessary.
  */
  init<Schema = Record<string, unknown>>(config?: OnyxConfig): IOnyxDatabase<Schema>;

  /**
   * Clear cached configuration so the next {@link init} call re-resolves
   * credentials immediately.
   */
  clearCacheConfig(): void;
}

export interface SecretMetadata {
  key: string;
  purpose?: string;
  updatedAt: Date;
}

export interface SecretRecord extends SecretMetadata {
  value: string;
}

export interface SecretsListResponse {
  records: SecretMetadata[];
  meta: { totalRecords: number };
}

export interface SecretSaveRequest {
  purpose?: string;
  value?: string;
}

export type SchemaDataType =
  | 'String'
  | 'Boolean'
  | 'Char'
  | 'Byte'
  | 'Short'
  | 'Int'
  | 'Float'
  | 'Double'
  | 'Long'
  | 'Timestamp'
  | 'EmbeddedObject'
  | 'EmbeddedList';

export type SchemaIdentifierGenerator = 'None' | 'Sequence' | 'UUID';

export interface SchemaIdentifier {
  name: string;
  generator?: SchemaIdentifierGenerator;
  type?: SchemaDataType | string;
}

export interface SchemaAttribute {
  name: string;
  type: SchemaDataType | string;
  isNullable?: boolean;
}

export type SchemaIndexType = 'DEFAULT' | 'LUCENE' | string;

export interface SchemaIndex {
  name: string;
  type?: SchemaIndexType;
  minimumScore?: number;
  [key: string]: unknown;
}

export interface SchemaResolver {
  name: string;
  resolver: string;
  [key: string]: unknown;
}

export type SchemaTriggerEvent =
  | 'PreInsert'
  | 'PostInsert'
  | 'PrePersist'
  | 'PostPersist'
  | 'PreUpdate'
  | 'PostUpdate'
  | 'PreDelete'
  | 'PostDelete'
  | string;

export interface SchemaTrigger {
  name: string;
  event: SchemaTriggerEvent;
  trigger: string;
  [key: string]: unknown;
}

export interface SchemaEntity {
  name: string;
  identifier?: SchemaIdentifier;
  partition?: string;
  attributes?: SchemaAttribute[];
  indexes?: SchemaIndex[];
  resolvers?: SchemaResolver[];
  triggers?: SchemaTrigger[];
  [key: string]: unknown;
}

export interface SchemaRevisionMetadata {
  revisionId?: string;
  createdAt?: Date;
  publishedAt?: Date;
  [key: string]: unknown;
}

export interface SchemaRevision {
  databaseId: string;
  revisionDescription?: string;
  entities: SchemaEntity[];
  meta?: SchemaRevisionMetadata;
  [key: string]: unknown;
}

export type SchemaHistoryEntry = SchemaRevision;

export type SchemaUpsertRequest = Omit<SchemaRevision, 'databaseId' | 'meta'> & {
  databaseId?: string;
  [key: string]: unknown;
};

export interface SchemaValidationResult {
  valid?: boolean;
  schema?: SchemaRevision;
  errors?: Array<{ message: string }>;
}

export interface SchemaAttributeChange {
  name: string;
  from: { type?: string; isNullable?: boolean };
  to: { type?: string; isNullable?: boolean };
}

export interface SchemaIndexChange {
  name: string;
  from: SchemaIndex;
  to: SchemaIndex;
}

export interface SchemaResolverChange {
  name: string;
  from: SchemaResolver;
  to: SchemaResolver;
}

export interface SchemaTriggerChange {
  name: string;
  from: SchemaTrigger;
  to: SchemaTrigger;
}

export interface SchemaTableDiff {
  name: string;
  partition?: { from: string | null; to: string | null } | null;
  identifier?: { from: SchemaIdentifier | null; to: SchemaIdentifier | null } | null;
  attributes?: {
    added: SchemaAttribute[];
    removed: string[];
    changed: SchemaAttributeChange[];
  };
  indexes?: {
    added: SchemaIndex[];
    removed: string[];
    changed: SchemaIndexChange[];
  };
  resolvers?: {
    added: SchemaResolver[];
    removed: string[];
    changed: SchemaResolverChange[];
  };
  triggers?: {
    added: SchemaTrigger[];
    removed: string[];
    changed: SchemaTriggerChange[];
  };
}

export interface SchemaDiff {
  newTables: string[];
  removedTables: string[];
  changedTables: SchemaTableDiff[];
}

export * from './common';
export * from './protocol';
export * from './builders';
