// filename: src/types/builders.ts
import type { Sort, StreamAction } from './common';
import type { QueryCondition, QueryCriteria } from './protocol';
import type { QueryResultsPromise } from '../builders/query-results';

/**
 * Builder used to compose query conditions.
 */
export interface IConditionBuilder {
  /**
   * Combines the current condition with another using `AND`.
   * @param condition - Additional condition or builder.
   * @example
   * ```ts
   * cb.and({ field: 'age', operator: 'GREATER_THAN', value: 18 });
   * ```
   */
  and(condition: IConditionBuilder | QueryCriteria): IConditionBuilder;
  /**
   * Combines the current condition with another using `OR`.
   * @param condition - Additional condition or builder.
   * @example
   * ```ts
   * cb.or({ field: 'status', operator: 'EQUAL', value: 'ACTIVE' });
   * ```
   */
  or(condition: IConditionBuilder | QueryCriteria): IConditionBuilder;
  /**
   * Materializes the composed condition into a `QueryCondition` object.
   * @example
   * ```ts
   * const cond = cb.toCondition();
   * ```
   */
  toCondition(): QueryCondition;
}

/**
 * Fluent query builder for constructing and executing select/update/delete operations.
 */
export interface IQueryBuilder<T = unknown> {
  /**
   * Sets the table to query.
   * @example
   * ```ts
   * const users = await db.from('User').list();
   * ```
   */
  from(table: string): IQueryBuilder<T>;
  /**
   * Selects a subset of fields to return.
   * @example
   * ```ts
   * const emails = await db.from('User').selectFields(['email']).list();
   * ```
   */
  selectFields(fields: string[]): IQueryBuilder<T>;
  /**
   * Resolves related values by name.
   * @example
   * ```ts
   * const users = await db
   *   .from('User')
   *   .resolve('profile')
   *   .list();
   * ```
   */
  resolve(values: string[] | string): IQueryBuilder<T>;
  /**
   * Adds a filter condition.
   * @example
   * ```ts
   * const active = await db.from('User').where(eq('status', 'active')).list();
   * ```
   */
  where(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T>;
  /**
   * Adds an additional filter with `AND`.
   * @example
   * ```ts
   * qb.where(eq('status', 'active')).and(eq('role', 'admin'));
   * ```
   */
  and(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T>;
  /**
   * Adds an additional filter with `OR`.
   * @example
   * ```ts
   * qb.where(eq('status', 'active')).or(eq('status', 'invited'));
   * ```
   */
  or(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T>;
  /**
   * Orders results by the provided fields.
   * @example
   * ```ts
   * const users = await db.from('User').orderBy(asc('createdAt')).list();
   * ```
   */
  orderBy(...sorts: Sort[]): IQueryBuilder<T>;
  /**
   * Groups results by the provided fields.
   * @example
   * ```ts
   * const stats = await db.from('User').groupBy('status').list();
   * ```
   */
  groupBy(...fields: string[]): IQueryBuilder<T>;
  /**
   * Ensures only distinct records are returned.
   * @example
   * ```ts
   * const roles = await db.from('User').selectFields(['role']).distinct().list();
   * ```
   */
  distinct(): IQueryBuilder<T>;
  /**
   * Limits the number of records returned.
   * @example
   * ```ts
   * const few = await db.from('User').limit(5).list();
   * ```
   */
  limit(n: number): IQueryBuilder<T>;
  /**
   * Restricts the query to a specific partition.
   * @example
   * ```ts
   * const tenantUsers = await db.from('User').inPartition('tenantA').list();
   * ```
   */
  inPartition(partition: string): IQueryBuilder<T>;

  /** Sets the page size for subsequent `list` or `page` calls. */
  pageSize(n: number): IQueryBuilder<T>;
  /**
   * Continues a paged query using a next-page token.
   * @example
   * ```ts
   * const page2 = await db.from('User').nextPage(token).list();
   * ```
   */
  nextPage(token: string): IQueryBuilder<T>;

  /**
   * Counts matching records.
   * @example
   * ```ts
   * const total = await db.from('User').count();
   * ```
   */
  count(): Promise<number>;
  /**
   * Lists records with optional pagination.
   * @example
   * ```ts
   * const users = await db.from('User').list({ pageSize: 10 });
   * ```
   */
  list(options?: { pageSize?: number; nextPage?: string }): QueryResultsPromise<T>;
  /**
   * Retrieves the first record or null.
   * @example
   * ```ts
   * const user = await db.from('User').firstOrNull();
   * ```
   */
  firstOrNull(): Promise<T | null>;
  /**
   * Retrieves exactly one record or null.
   * @example
   * ```ts
   * const user = await db
   *   .from('User')
   *   .where(eq('email', 'a@b.com'))
   *   .one();
   * ```
   */
  one(): Promise<T | null>;
  /**
   * Retrieves a single page of records with optional next token.
   * @example
   * ```ts
   * const { records, nextPage } = await db.from('User').page({ pageSize: 25 });
   * ```
   */
  page(options?: { pageSize?: number; nextPage?: string }): Promise<{ records: T[]; nextPage?: string | null }>;

  /**
   * Sets field updates for an update query.
   * @example
   * ```ts
   * await db
   *   .from('User')
   *   .where(eq('id', 'u1'))
   *   .setUpdates({ status: 'active' })
   *   .update();
   * ```
   */
  setUpdates(updates: Partial<T>): IQueryBuilder<T>;
  /**
   * Executes an update operation.
   * @example
   * ```ts
   * await db.from('User').where(eq('id', 'u1')).setUpdates({ status: 'active' }).update();
   * ```
   */
  update(): Promise<unknown>;
  /**
   * Executes a delete operation.
   * @example
   * ```ts
   * await db.from('User').where(eq('status', 'inactive')).delete();
   * ```
   */
  delete(): Promise<unknown>;

  /**
   * Registers a listener for added items on a stream.
   * @example
   * ```ts
   * db.from('User').onItemAdded(u => console.log('added', u));
   * ```
   */
  onItemAdded(listener: (entity: T) => void): IQueryBuilder<T>;
  /**
   * Registers a listener for updated items on a stream.
   * @example
   * ```ts
   * db.from('User').onItemUpdated(u => console.log('updated', u));
   * ```
   */
  onItemUpdated(listener: (entity: T) => void): IQueryBuilder<T>;
  /**
   * Registers a listener for deleted items on a stream.
   * @example
   * ```ts
   * db.from('User').onItemDeleted(u => console.log('deleted', u));
   * ```
   */
  onItemDeleted(listener: (entity: T) => void): IQueryBuilder<T>;
  /**
   * Registers a listener for any stream item with its action.
   * @example
   * ```ts
   * db.from('User').onItem((u, action) => console.log(action, u));
   * ```
   */
  onItem(listener: (entity: T | null, action: StreamAction) => void): IQueryBuilder<T>;
  /**
   * Starts a stream including query results.
   * @example
   * ```ts
   * const { cancel } = await db.from('User').stream();
   * ```
   */
  stream(includeQueryResults?: boolean, keepAlive?: boolean): Promise<{ cancel: () => void }>;
  /**
   * Starts a stream emitting only events.
   * @example
   * ```ts
   * const { cancel } = await db.from('User').streamEventsOnly();
   * ```
   */
  streamEventsOnly(keepAlive?: boolean): Promise<{ cancel: () => void }>;
  /**
   * Starts a stream that returns events alongside query results.
   * @example
   * ```ts
   * const { cancel } = await db.from('User').streamWithQueryResults();
   * ```
   */
  streamWithQueryResults(keepAlive?: boolean): Promise<{ cancel: () => void }>;
}

export type { QueryResults, QueryResultsPromise } from '../builders/query-results';

/** Builder for save operations. */
export interface ISaveBuilder<T = unknown> {
  /**
   * Cascades specified relationships when saving.
   * @example
   * ```ts
   * await db.save('User').cascade('role').one(user);
   * ```
   */
  cascade(...relationships: string[]): ISaveBuilder<T>;
  /**
   * Persists a single entity.
   * @example
   * ```ts
   * await db.save('User').one({ id: 'u1' });
   * ```
   */
  one(entity: Partial<T>): Promise<unknown>;
  /**
   * Persists multiple entities.
   * @example
   * ```ts
   * await db.save('User').many([{ id: 'u1' }, { id: 'u2' }]);
   * ```
   */
  many(entities: Array<Partial<T>>): Promise<unknown>;
}

/** Builder for cascading save/delete operations across multiple tables. */
export interface ICascadeBuilder<Schema = Record<string, unknown>> {
  /**
   * Specifies relationships to cascade through.
   * @example
   * ```ts
   * const builder = db.cascade('permissions');
   * ```
   */
  cascade(...relationships: string[]): ICascadeBuilder<Schema>;
  /**
   * Saves one or many entities for a given table.
   * @example
   * ```ts
   * await db.cascade('permissions').save('Role', role);
   * ```
   */
  save<Table extends keyof Schema & string>(
    table: Table,
    entityOrEntities: Partial<Schema[Table]> | Array<Partial<Schema[Table]>>,
  ): Promise<unknown>;
  /**
   * Deletes an entity by primary key.
   * @example
   * ```ts
   * await db.cascade('permissions').delete('Role', 'admin');
   * ```
   */
  delete<Table extends keyof Schema & string>(
    table: Table,
    primaryKey: string,
  ): Promise<Schema[Table]>;
}

/** Builder for describing cascade relationship metadata. */
export interface ICascadeRelationshipBuilder {
  /**
   * Names the relationship graph.
   * @example
   * ```ts
   * builder.graph('permissions');
   * ```
   */
  graph(name: string): ICascadeRelationshipBuilder;
  /**
   * Sets the graph type.
   * @example
   * ```ts
   * builder.graphType('Permission');
   * ```
   */
  graphType(type: string): ICascadeRelationshipBuilder;
  /**
   * Field on the target entity.
   * @example
   * ```ts
   * builder.targetField('roleId');
   * ```
   */
  targetField(field: string): ICascadeRelationshipBuilder;
  /**
   * Field on the source entity.
   * @example
   * ```ts
   * const rel = builder.sourceField('id');
   * ```
   */
  sourceField(field: string): string;
}
