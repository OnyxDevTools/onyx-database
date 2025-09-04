// filename: src/builders/query-builder.ts
import type { IQueryBuilder, IConditionBuilder, QueryResults } from '../types/builders';
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
  /**
   * Count records matching a select query.
   *
   * @param table Table name to target.
   * @param select Select query details.
   * @param partition Optional partition identifier.
   * @example
   * ```ts
   * await exec.count('Users', selectQuery);
   * ```
   */
  count(table: string, select: SelectQuery, partition?: string): Promise<number>;

  /**
   * Retrieve a page of results for a select query.
   *
   * @param table Table name to target.
   * @param select Select query details.
   * @param opts Paging options including size, token and partition.
   * @example
   * ```ts
   * const page = await exec.queryPage('Users', selectQuery, { pageSize: 10 });
   * ```
   */
  queryPage<T>(
    table: string,
    select: SelectQuery,
    opts: { pageSize?: number; nextPage?: string; partition?: string }
  ): Promise<QueryPage<T>>;

  /**
   * Execute an update query.
   *
   * @param table Table name to update.
   * @param update Update statement to apply.
   * @param partition Optional partition identifier.
   * @example
   * ```ts
   * await exec.update('Users', updateQuery);
   * ```
   */
  update(table: string, update: UpdateQuery, partition?: string): Promise<unknown>;

  /**
   * Delete records using a select query as filter.
   *
   * @param table Table name to target.
   * @param select Select query to filter deletions.
   * @param partition Optional partition identifier.
   * @example
   * ```ts
   * await exec.deleteByQuery('Users', selectQuery);
   * ```
   */
  deleteByQuery(table: string, select: SelectQuery, partition?: string): Promise<unknown>;

  /**
   * Start a streaming query.
   *
   * @param table Table name to stream from.
   * @param select Select query details.
   * @param includeQueryResults Whether to emit existing results.
   * @param keepAlive Whether to keep the connection alive.
   * @param handlers Event callbacks for stream actions.
   * @example
   * ```ts
   * const sub = await exec.stream('Users', selectQuery, true, false, { onItem: console.log });
   * ```
   */
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

/**
 * Wrap raw criteria in a SingleCondition structure.
 *
 * @param criteria Criteria to wrap.
 * @example
 * ```ts
 * const single = toSingleCondition({ field: 'id', operator: 'eq', value: '1' });
 * ```
 */
function toSingleCondition(criteria: QueryCriteria): QueryCondition {
  return { conditionType: 'SingleCondition', criteria };
}

/**
 * Normalize builder or criteria input into a QueryCondition.
 *
 * @param input Condition builder or raw criteria.
 * @example
 * ```ts
 * const c = toCondition({ field: 'name', operator: 'eq', value: 'Ada' });
 * ```
 */
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

  /**
   * Create a builder with the given executor and optional starting table.
   *
   * @param executor QueryExecutor implementation.
   * @param table Optional initial table name.
   * @example
   * ```ts
   * const qb = new QueryBuilder(exec, 'Users');
   * ```
   */
  constructor(executor: QueryExecutor, table: string | null) {
    this.exec = executor;
    this.table = table;
  }

  /** ----------------- private helpers ----------------- */
  /**
   * Ensure a table name has been defined before executing operations.
   *
   * @example
   * ```ts
   * const table = builder['ensureTable']();
   * ```
   */
  private ensureTable(): string {
    if (!this.table) throw new Error('Table is not defined. Call from(<table>) first.');
    return this.table;
  }

  /**
   * Convert current builder state to a SelectQuery object.
   *
   * @example
   * ```ts
   * const select = builder['toSelectQuery']();
   * ```
   */
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

  /**
   * Set the table to operate on.
   *
   * @param table Table name.
   * @example
   * ```ts
   * builder.from('Users');
   * ```
   */
  from(table: string): IQueryBuilder<T> {
    this.table = table;
    return this;
  }

  /**
   * Choose which fields to select.
   *
   * @param fields List of field names to include.
   * @example
   * ```ts
   * builder.selectFields(['id', 'name']);
   * ```
   */
  selectFields(fields: string[]): IQueryBuilder<T> {
    this.fields = Array.isArray(fields) && fields.length > 0 ? fields : null;
    return this;
  }

  /**
   * Define relationship resolvers to include.
   *
   * @param values Resolver names to include.
   * @example
   * ```ts
   * builder.resolve('owner');
   * ```
   */
  resolve(values: string[] | string): IQueryBuilder<T> {
    this.resolvers = Array.isArray(values) ? values : [values];
    return this;
  }

  /**
   * Start a where clause with the given condition.
   *
   * @param condition Condition builder or raw criteria to start the clause.
   * @example
   * ```ts
   * builder.where({ field: 'id', operator: 'eq', value: '1' });
   * ```
   */
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

  /**
   * Add an AND condition to the existing where clause.
   *
   * @param condition Condition builder or raw criteria to AND.
   * @example
   * ```ts
   * builder.and({ field: 'age', operator: 'gt', value: 18 });
   * ```
   */
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

  /**
   * Add an OR condition to the existing where clause.
   *
   * @param condition Condition builder or raw criteria to OR.
   * @example
   * ```ts
   * builder.or({ field: 'status', operator: 'eq', value: 'active' });
   * ```
   */
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

  /**
   * Specify sort order for the query.
   *
   * @param sorts Sort definitions.
   * @example
   * ```ts
   * builder.orderBy({ field: 'name', direction: 'asc' });
   * ```
   */
  orderBy(...sorts: Sort[]): IQueryBuilder<T> {
    this.sort = sorts;
    return this;
  }

  /**
   * Group results by the provided fields.
   *
   * @param fields Field names to group by.
   * @example
   * ```ts
   * builder.groupBy('category');
   * ```
   */
  groupBy(...fields: string[]): IQueryBuilder<T> {
    this.groupByValues = fields.length ? fields : null;
    return this;
  }

  /**
   * Request distinct results.
   *
   * @example
   * ```ts
   * builder.distinct();
   * ```
   */
  distinct(): IQueryBuilder<T> {
    this.distinctValue = true;
    return this;
  }

  /**
   * Limit the number of records returned.
   *
   * @param n Maximum number of records.
   * @example
   * ```ts
   * builder.limit(10);
   * ```
   */
  limit(n: number): IQueryBuilder<T> {
    this.limitValue = n;
    return this;
  }

  /**
   * Restrict the query to a specific partition.
   *
   * @param partition Partition identifier.
   * @example
   * ```ts
   * builder.inPartition('us-west');
   * ```
   */
  inPartition(partition: string): IQueryBuilder<T> {
    this.partitionValue = partition;
    return this;
  }

  /**
   * Set the desired page size for paging queries.
   *
   * @param n Page size.
   * @example
   * ```ts
   * builder.pageSize(20);
   * ```
   */
  pageSize(n: number): IQueryBuilder<T> {
    this.pageSizeValue = n;
    return this;
  }

  /**
   * Provide a paging token for continued queries.
   *
   * @param token Paging token from a previous page call.
   * @example
   * ```ts
   * builder.nextPage(token);
   * ```
   */
  nextPage(token: string): IQueryBuilder<T> {
    this.nextPageValue = token;
    return this;
  }

  /**
   * Switch to update mode with the provided update payload.
   *
   * @param updates Partial entity values to apply.
   * @example
   * ```ts
   * builder.setUpdates({ name: 'Ada' });
   * ```
   */
  setUpdates(updates: Partial<T>): IQueryBuilder<T> {
    this.mode = 'update';
    this.updates = updates;
    return this;
  }

  /**
   * Count records that match the current query.
   *
   * @example
   * ```ts
   * const total = await builder.count();
   * ```
   */
  async count(): Promise<number> {
    if (this.mode !== 'select') throw new Error('Cannot call count() in update mode.');
    const table = this.ensureTable();
    return this.exec.count(table, this.toSelectQuery(), this.partitionValue);
  }

  /**
   * Retrieve a page of records using the current query state.
   *
   * @param options Paging options.
   * @example
   * ```ts
   * const { records, nextPage } = await builder.page({ pageSize: 10 });
   * ```
   */
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

  /**
   * Convenience method to list records without paging metadata.
   *
   * @param options Paging options.
   * @example
   * ```ts
   * const users = await builder.list({ pageSize: 5 });
   * ```
   */
  async list(options: { pageSize?: number; nextPage?: string } = {}): Promise<QueryResults<T>> {
    const pg = await this.page(options);
    const arr = (Array.isArray(pg.records) ? pg.records : []) as QueryResults<T>;
    arr.nextPage = pg.nextPage ?? null;
    return arr;
  }

  /**
   * Fetch the first matching record or null.
   *
   * @example
   * ```ts
   * const user = await builder.firstOrNull();
   * ```
   */
  async firstOrNull(): Promise<T | null> {
    if (this.mode !== 'select') throw new Error('Cannot call firstOrNull() in update mode.');
    if (!this.conditions) throw new OnyxError('firstOrNull() requires a where() clause.');
    this.limitValue = 1;
    const pg = await this.page();
    return Array.isArray(pg.records) && pg.records.length > 0 ? pg.records[0] : null;
  }

  /**
   * Alias for firstOrNull().
   *
   * @example
   * ```ts
   * const user = await builder.one();
   * ```
   */
  async one(): Promise<T | null> {
    return this.firstOrNull();
  }

  /**
   * Delete records matching the current query.
   *
   * @example
   * ```ts
   * await builder.delete();
   * ```
   */
  async delete(): Promise<unknown> {
    if (this.mode !== 'select') throw new Error('delete() is only applicable in select mode.');
    const table = this.ensureTable();
    return this.exec.deleteByQuery(table, this.toSelectQuery(), this.partitionValue);
  }

  /**
   * Execute an update with previously provided payload.
   *
   * @example
   * ```ts
   * await builder.setUpdates({ name: 'Ada' }).update();
   * ```
   */
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

  /**
   * Register a listener for added items when streaming.
   *
   * @param listener Callback for added entities.
   * @example
   * ```ts
   * builder.onItemAdded(e => console.log('added', e));
   * ```
   */
  onItemAdded(listener: (entity: T) => void): IQueryBuilder<T> {
    this.onItemAddedListener = listener;
    return this;
  }

  /**
   * Register a listener for updated items when streaming.
   *
   * @param listener Callback for updated entities.
   * @example
   * ```ts
   * builder.onItemUpdated(e => console.log('updated', e));
   * ```
   */
  onItemUpdated(listener: (entity: T) => void): IQueryBuilder<T> {
    this.onItemUpdatedListener = listener;
    return this;
  }

  /**
   * Register a listener for deleted items when streaming.
   *
   * @param listener Callback for deleted entities.
   * @example
   * ```ts
   * builder.onItemDeleted(e => console.log('deleted', e));
   * ```
   */
  onItemDeleted(listener: (entity: T) => void): IQueryBuilder<T> {
    this.onItemDeletedListener = listener;
    return this;
  }

  /**
   * Register a listener for any stream action.
   *
   * @param listener Callback receiving entity and action type.
   * @example
   * ```ts
   * builder.onItem((e, a) => console.log(a, e));
   * ```
   */
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

  /**
   * Start a streaming query with optional initial results and keep-alive support.
   *
   * @param includeQueryResults Whether to emit existing query results.
   * @param keepAlive Whether to keep the connection alive.
   * @example
   * ```ts
   * const sub = await builder.stream();
   * sub.cancel();
   * ```
   */
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
