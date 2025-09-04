// filename: src/types/builders.ts
import type { Sort, StreamAction } from './common';
import type { QueryCondition, QueryCriteria } from './protocol';
import type { QueryResults } from '../builders/query-results';

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
   */
  toCondition(): QueryCondition;
}

/**
 * Fluent query builder for constructing and executing select/update/delete operations.
 */
export interface IQueryBuilder<T = unknown> {
  /** Sets the table to query. */
  from(table: string): IQueryBuilder<T>;
  /** Selects a subset of fields to return. */
  selectFields(fields: string[]): IQueryBuilder<T>;
  /** Resolves related values by name. */
  resolve(values: string[] | string): IQueryBuilder<T>;
  /** Adds a filter condition. */
  where(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T>;
  /** Adds an additional filter with `AND`. */
  and(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T>;
  /** Adds an additional filter with `OR`. */
  or(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T>;
  /** Orders results by the provided fields. */
  orderBy(...sorts: Sort[]): IQueryBuilder<T>;
  /** Groups results by the provided fields. */
  groupBy(...fields: string[]): IQueryBuilder<T>;
  /** Ensures only distinct records are returned. */
  distinct(): IQueryBuilder<T>;
  /** Limits the number of records returned. */
  limit(n: number): IQueryBuilder<T>;
  /** Restricts the query to a specific partition. */
  inPartition(partition: string): IQueryBuilder<T>;

  /** Sets the page size for subsequent `list` or `page` calls. */
  pageSize(n: number): IQueryBuilder<T>;
  /** Continues a paged query using a next-page token. */
  nextPage(token: string): IQueryBuilder<T>;

  /** Counts matching records. */
  count(): Promise<number>;
  /** Lists records with optional pagination. */
  list(options?: { pageSize?: number; nextPage?: string }): Promise<QueryResults<T>>;
  /** Retrieves the first record or null. */
  firstOrNull(): Promise<T | null>;
  /** Retrieves exactly one record or null. */
  one(): Promise<T | null>;
  /** Retrieves a single page of records with optional next token. */
  page(options?: { pageSize?: number; nextPage?: string }): Promise<{ records: T[]; nextPage?: string | null }>;

  /** Sets field updates for an update query. */
  setUpdates(updates: Partial<T>): IQueryBuilder<T>;
  /** Executes an update operation. */
  update(): Promise<unknown>;
  /** Executes a delete operation. */
  delete(): Promise<unknown>;

  /** Registers a listener for added items on a stream. */
  onItemAdded(listener: (entity: T) => void): IQueryBuilder<T>;
  /** Registers a listener for updated items on a stream. */
  onItemUpdated(listener: (entity: T) => void): IQueryBuilder<T>;
  /** Registers a listener for deleted items on a stream. */
  onItemDeleted(listener: (entity: T) => void): IQueryBuilder<T>;
  /** Registers a listener for any stream item with its action. */
  onItem(listener: (entity: T | null, action: StreamAction) => void): IQueryBuilder<T>;
  /** Starts a stream including query results. */
  stream(includeQueryResults?: boolean, keepAlive?: boolean): Promise<{ cancel: () => void }>;
  /** Starts a stream emitting only events. */
  streamEventsOnly(keepAlive?: boolean): Promise<{ cancel: () => void }>;
  /** Starts a stream that returns events alongside query results. */
  streamWithQueryResults(keepAlive?: boolean): Promise<{ cancel: () => void }>;
}

export type { QueryResults } from '../builders/query-results';

/** Builder for save operations. */
export interface ISaveBuilder<T = unknown> {
  /** Cascades specified relationships when saving. */
  cascade(...relationships: string[]): ISaveBuilder<T>;
  /** Persists a single entity. */
  one(entity: Partial<T>): Promise<unknown>;
  /** Persists multiple entities. */
  many(entities: Array<Partial<T>>): Promise<unknown>;
}

/** Builder for cascading save/delete operations across multiple tables. */
export interface ICascadeBuilder<Schema = Record<string, unknown>> {
  /** Specifies relationships to cascade through. */
  cascade(...relationships: string[]): ICascadeBuilder<Schema>;
  /** Saves one or many entities for a given table. */
  save<Table extends keyof Schema & string>(
    table: Table,
    entityOrEntities: Partial<Schema[Table]> | Array<Partial<Schema[Table]>>
  ): Promise<unknown>;
  /** Deletes an entity by primary key. */
  delete<Table extends keyof Schema & string>(
    table: Table,
    primaryKey: string,
  ): Promise<Schema[Table]>;
}

/** Builder for describing cascade relationship metadata. */
export interface ICascadeRelationshipBuilder {
  /** Names the relationship graph. */
  graph(name: string): ICascadeRelationshipBuilder;
  /** Sets the graph type. */
  graphType(type: string): ICascadeRelationshipBuilder;
  /** Field on the target entity. */
  targetField(field: string): ICascadeRelationshipBuilder;
  /** Field on the source entity. */
  sourceField(field: string): string;
}
