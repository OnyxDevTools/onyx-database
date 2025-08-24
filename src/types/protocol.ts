// filename: src/types/protocol.ts
import type { Sort, LogicalOperator, QueryCriteriaOperator } from './common';

export type QueryCriteria = {
  field: string;
  operator: QueryCriteriaOperator;
  value?: unknown;
};

export type QueryCondition =
  | { conditionType: 'SingleCondition'; criteria: QueryCriteria }
  | { conditionType: 'CompoundCondition'; operator: LogicalOperator; conditions: QueryCondition[] };

export type SelectQuery = {
  type: 'SelectQuery';
  fields?: string[] | null;
  conditions?: QueryCondition | null;
  sort?: Sort[] | null;
  limit?: number | null;
  distinct?: boolean | null;
  groupBy?: string[] | null;
  partition?: string | null;
  resolvers?: string[] | null;
};

export type UpdateQuery = {
  type: 'UpdateQuery';
  conditions?: QueryCondition | null;
  updates: Record<string, unknown>;
  sort?: Sort[] | null;
  limit?: number | null;
  partition?: string | null;
};

export type QueryPage<T> = {
  records: T[];
  nextPage?: string | null;
};