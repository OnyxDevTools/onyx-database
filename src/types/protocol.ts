// filename: src/types/protocol.ts
import type { Sort, LogicalOperator, QueryCriteriaOperator } from './common';

export interface QueryCriteria {
  field: string;
  operator: QueryCriteriaOperator;
  value?: unknown;
}

export type QueryCondition =
  | { conditionType: 'SingleCondition'; criteria: QueryCriteria }
  | { conditionType: 'CompoundCondition'; operator: LogicalOperator; conditions: QueryCondition[] };

export interface SelectQuery {
  type: 'SelectQuery';
  fields?: string[] | null;
  conditions?: QueryCondition | null;
  sort?: Sort[] | null;
  limit?: number | null;
  distinct?: boolean | null;
  groupBy?: string[] | null;
  partition?: string | null;
  resolvers?: string[] | null;
}

export interface UpdateQuery {
  type: 'UpdateQuery';
  conditions?: QueryCondition | null;
  updates: Record<string, unknown>;
  sort?: Sort[] | null;
  limit?: number | null;
  partition?: string | null;
}

export interface QueryPage<T> {
  records: T[];
  nextPage?: string | null;
}