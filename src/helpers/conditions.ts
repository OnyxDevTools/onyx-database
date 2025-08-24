// filename: src/helpers/conditions.ts
import { ConditionBuilderImpl } from '../builders/condition-builder';
import type { QueryCriteria } from '../types/protocol';
import type { QueryCriteriaOperator } from '../types/common';

const c = (field: string, operator: QueryCriteriaOperator, value?: unknown) =>
  new ConditionBuilderImpl(({ field, operator, value } as QueryCriteria));

export const eq = (field: string, value: unknown) => c(field, 'EQUAL', value);
export const neq = (field: string, value: unknown) => c(field, 'NOT_EQUAL', value);
export const inOp = (field: string, values: unknown[]) => c(field, 'IN', values);
export const notIn = (field: string, values: unknown[]) => c(field, 'NOT_IN', values);
export const between = (field: string, lower: unknown, upper: unknown) => c(field, 'BETWEEN', [lower, upper]);
export const gt = (field: string, value: unknown) => c(field, 'GREATER_THAN', value);
export const gte = (field: string, value: unknown) => c(field, 'GREATER_THAN_EQUAL', value);
export const lt = (field: string, value: unknown) => c(field, 'LESS_THAN', value);
export const lte = (field: string, value: unknown) => c(field, 'LESS_THAN_EQUAL', value);
export const matches = (field: string, regex: string) => c(field, 'MATCHES', regex);
export const notMatches = (field: string, regex: string) => c(field, 'NOT_MATCHES', regex);
export const like = (field: string, pattern: string) => c(field, 'LIKE', pattern);
export const notLike = (field: string, pattern: string) => c(field, 'NOT_LIKE', pattern);
export const contains = (field: string, value: unknown) => c(field, 'CONTAINS', value);
export const containsIgnoreCase = (field: string, value: unknown) => c(field, 'CONTAINS_IGNORE_CASE', value);
export const notContains = (field: string, value: unknown) => c(field, 'NOT_CONTAINS', value);
export const notContainsIgnoreCase = (field: string, value: unknown) => c(field, 'NOT_CONTAINS_IGNORE_CASE', value);
export const startsWith = (field: string, prefix: string) => c(field, 'STARTS_WITH', prefix);
export const notStartsWith = (field: string, prefix: string) => c(field, 'NOT_STARTS_WITH', prefix);
export const isNull = (field: string) => c(field, 'IS_NULL');
export const notNull = (field: string) => c(field, 'NOT_NULL');