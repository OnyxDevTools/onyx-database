// filename: src/helpers/conditions.ts
import { ConditionBuilderImpl } from '../builders/condition-builder';
import type { IQueryBuilder } from '../types/builders';
import type { QueryCriteria } from '../types/protocol';
import type {
  ApproximateSearchOptions,
  FullTextQuery,
  HnswSearchQueryInput,
  QueryCriteriaOperator,
  VectorSearchQueryInput,
} from '../types/common';
import {
  approximateIndexCandidateQuery,
  hnswSearchQuery,
  vectorSearchQuery,
} from './candidate-search';

const c = (field: string, operator: QueryCriteriaOperator, value?: unknown) =>
  new ConditionBuilderImpl({ field, operator, value } as QueryCriteria);

const fullText = (queryText: string, minScore?: number | null): FullTextQuery => ({
  queryText,
  minScore: minScore ?? null,
});

export const eq = (field: string, value: unknown) => c(field, 'EQUAL', value);
export const neq = (field: string, value: unknown) => c(field, 'NOT_EQUAL', value);
export function inOp(field: string, values: string): ConditionBuilderImpl;
export function inOp<T>(field: string, values: unknown[] | IQueryBuilder<T>): ConditionBuilderImpl;
export function inOp(field: string, values: unknown[] | string | IQueryBuilder<unknown>): ConditionBuilderImpl {
  const parsed =
    typeof values === 'string'
      ? values.split(',').map(v => v.trim()).filter(v => v.length)
      : values;
  return c(field, 'IN', parsed);
}
export function within<T>(
  field: string,
  values: string | unknown[] | IQueryBuilder<T>,
): ConditionBuilderImpl {
  return inOp(field, values as any);
}
export function notIn(field: string, values: string): ConditionBuilderImpl;
export function notIn<T>(field: string, values: unknown[] | IQueryBuilder<T>): ConditionBuilderImpl;
export function notIn(field: string, values: unknown[] | string | IQueryBuilder<unknown>): ConditionBuilderImpl {
  const parsed =
    typeof values === 'string'
      ? values.split(',').map(v => v.trim()).filter(v => v.length)
      : values;
  return c(field, 'NOT_IN', parsed);
}
export function notWithin<T>(
  field: string,
  values: string | unknown[] | IQueryBuilder<T>,
): ConditionBuilderImpl {
  return notIn(field, values as any);
}
export const between = (field: string, lower: unknown, upper: unknown) => c(field, 'BETWEEN', [lower, upper]);
export const notBetween = (field: string, lower: unknown, upper: unknown) =>
  c(field, 'NOT_BETWEEN', [lower, upper]);
export const gt = (field: string, value: unknown) => c(field, 'GREATER_THAN', value);
export const gte = (field: string, value: unknown) => c(field, 'GREATER_THAN_EQUAL', value);
export const lt = (field: string, value: unknown) => c(field, 'LESS_THAN', value);
export const lte = (field: string, value: unknown) => c(field, 'LESS_THAN_EQUAL', value);
export const matches = (field: string, regex: string) => c(field, 'MATCHES', regex);
export function search(queryText: string, minScore?: number | null): ConditionBuilderImpl;
export function search(searchQuery: VectorSearchQueryInput): ConditionBuilderImpl;
export function search(
  queryTextOrSearch: string | VectorSearchQueryInput,
  minScore?: number | null,
): ConditionBuilderImpl {
  return c(
    '__full_text__',
    'MATCHES',
    typeof queryTextOrSearch === 'string'
      ? fullText(queryTextOrSearch, minScore)
      : vectorSearchQuery(queryTextOrSearch),
  );
}

/** Sole-root condition for physically bounded lexical candidate admission. */
export function approximateSearch(
  queryText: string,
  options?: ApproximateSearchOptions,
): ConditionBuilderImpl;
export function approximateSearch(searchQuery: VectorSearchQueryInput): ConditionBuilderImpl;
export function approximateSearch(
  queryTextOrSearch: string | VectorSearchQueryInput,
  options: ApproximateSearchOptions = {},
): ConditionBuilderImpl {
  const query = vectorSearchQuery(
    typeof queryTextOrSearch === 'string'
      ? { text: queryTextOrSearch, ...options }
      : queryTextOrSearch,
  );
  if (query.text === null || query.semantic !== null) {
    throw new Error('SEARCH_CANDIDATES supports text-only VectorSearchQuery values');
  }
  return c('__full_text__', 'SEARCH_CANDIDATES', query);
}

/** Sole-root condition for physically bounded native-HNSW admission. */
export const hnswCandidates = (query: HnswSearchQueryInput) =>
  c('__full_text__', 'HNSW_CANDIDATES', hnswSearchQuery(query));

/** Sole-root condition for bounded ordinary-index candidate admission. */
export const approximateCandidates = (
  attribute: string,
  valueOrValues: unknown | readonly unknown[],
  maxCandidates?: number,
) => {
  if (attribute.trim().length === 0) throw new TypeError('candidate attribute must not be blank');
  return c(
    attribute,
    'CANDIDATES',
    approximateIndexCandidateQuery(valueOrValues, maxCandidates),
  );
};
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
