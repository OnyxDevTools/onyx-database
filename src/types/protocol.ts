// filename: src/types/protocol.ts
import type { Sort, LogicalOperator, QueryCriteriaOperator } from './common';

/**
 * Represents a single field comparison in a query.
 *
 * @property field - Field name to evaluate.
 * @property operator - Comparison operator.
 * @property value - Value to compare against.
 * @example
 * ```ts
 * const criteria: QueryCriteria = { field: 'age', operator: 'GREATER_THAN', value: 18 };
 * ```
 */
export interface QueryCriteria {
  field: string;
  operator: QueryCriteriaOperator;
  value?: unknown;
}

/**
 * Recursive condition structure used to express complex WHERE clauses.
 *
 * @example
 * ```ts
 * const condition: QueryCondition = {
 *   conditionType: 'CompoundCondition',
 *   operator: 'AND',
 *   conditions: [
 *     { conditionType: 'SingleCondition', criteria: { field: 'age', operator: 'GREATER_THAN', value: 18 } },
 *     { conditionType: 'SingleCondition', criteria: { field: 'status', operator: 'EQUAL', value: 'ACTIVE' } }
 *   ]
 * };
 * ```
 */
export type QueryCondition =
  | { conditionType: 'SingleCondition'; criteria: QueryCriteria }
  | { conditionType: 'CompoundCondition'; operator: LogicalOperator; conditions: QueryCondition[] };

/**
 * Wire format for select queries sent to the server.
 *
 * @example
 * ```ts
 * const query: SelectQuery = {
 *   type: 'SelectQuery',
 *   fields: ['id', 'name'],
 *   limit: 10
 * };
 * ```
 */
export interface SelectQuery {
  type: 'SelectQuery';
  table?: string | null;
  fields?: string[] | null;
  conditions?: QueryCondition | null;
  sort?: Sort[] | null;
  limit?: number | null;
  distinct?: boolean | null;
  groupBy?: string[] | null;
  partition?: string | null;
  resolvers?: string[] | null;
}

/**
 * Wire format for update queries sent to the server.
 *
 * @example
 * ```ts
 * const update: UpdateQuery = {
 *   type: 'UpdateQuery',
 *   updates: { name: 'New Name' }
 * };
 * ```
 */
export interface UpdateQuery {
  type: 'UpdateQuery';
  conditions?: QueryCondition | null;
  updates: Record<string, unknown>;
  sort?: Sort[] | null;
  limit?: number | null;
  partition?: string | null;
}

/**
 * A single page of query results.
 *
 * @example
 * ```ts
 * const page: QueryPage<User> = { records: users, nextPage: token };
 * ```
 */
export interface QueryPage<T> {
  /** Records in the current page. */
  records: T[];
  /** Token for the next page or null if none. */
  nextPage?: string | null;
}
