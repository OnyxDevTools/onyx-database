// filename: src/types/public.ts
import type { OnyxDocument, FetchImpl } from './common';
import type {
  IQueryBuilder,
  ICascadeBuilder,
  ISaveBuilder,
  ICascadeRelationshipBuilder,
} from './builders';

export interface OnyxConfig {
  baseUrl?: string;
  databaseId?: string;
  apiKey?: string;
  apiSecret?: string;
  fetch?: FetchImpl;
}

export interface IOnyxDatabase<Schema = Record<string, unknown>> {
  /**
   * Begin a query against a table.
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
  cascade(...relationships: string[]): ICascadeBuilder<Schema>;

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
  ): Promise<T>;

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
   */
  delete<Table extends keyof Schema & string, T = Schema[Table]>(
    table: Table,
    primaryKey: string,
    options?: { partition?: string; relationships?: string[] }
  ): Promise<T>;

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

  /** Cancels active streams; safe to call multiple times */
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
   */
  init<Schema = Record<string, unknown>>(config?: OnyxConfig): IOnyxDatabase<Schema>;
}

export * from './common';
export * from './protocol';
export * from './builders';