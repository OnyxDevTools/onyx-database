import type { QueryCondition } from '../types/protocol';
import type { QueryCriteriaOperator } from '../types/common';

const SOLE_ROOT_CANDIDATE_OPERATORS = new Set<QueryCriteriaOperator>([
  'SEARCH_CANDIDATES',
  'HNSW_CANDIDATES',
]);

const READ_ONLY_SEARCH_OPERATORS = new Set<QueryCriteriaOperator>([
  ...SOLE_ROOT_CANDIDATE_OPERATORS,
  'CANDIDATES',
  'SEARCH',
]);

function matchingOperator(
  condition: QueryCondition,
  operators: ReadonlySet<QueryCriteriaOperator>,
): QueryCriteriaOperator | null {
  if (condition.conditionType === 'SingleCondition') {
    return operators.has(condition.criteria.operator)
      ? condition.criteria.operator
      : null;
  }
  for (const child of condition.conditions) {
    const operator = matchingOperator(child, operators);
    if (operator !== null) return operator;
  }
  return null;
}

interface FullTextSearchSummary {
  searchCount: number;
  fullTextCriteriaCount: number;
  invalidSearchTargetCount: number;
}

function summarizeFullTextSearch(condition: QueryCondition): FullTextSearchSummary {
  if (condition.conditionType === 'SingleCondition') {
    return {
      searchCount: condition.criteria.operator === 'SEARCH' ? 1 : 0,
      fullTextCriteriaCount: condition.criteria.field === '__full_text__' ? 1 : 0,
      invalidSearchTargetCount:
        condition.criteria.operator === 'SEARCH' && condition.criteria.field !== '__full_text__'
          ? 1
          : 0,
    };
  }

  return condition.conditions.reduce<FullTextSearchSummary>(
    (summary, child) => {
      const childSummary = summarizeFullTextSearch(child);
      summary.searchCount += childSummary.searchCount;
      summary.fullTextCriteriaCount += childSummary.fullTextCriteriaCount;
      summary.invalidSearchTargetCount += childSummary.invalidSearchTargetCount;
      return summary;
    },
    { searchCount: 0, fullTextCriteriaCount: 0, invalidSearchTargetCount: 0 },
  );
}

function countOperator(condition: QueryCondition, operator: QueryCriteriaOperator): number {
  if (condition.conditionType === 'SingleCondition') {
    return condition.criteria.operator === operator ? 1 : 0;
  }
  return condition.conditions.reduce(
    (count, child) => count + countOperator(child, operator),
    0,
  );
}

function isConjunction(condition: QueryCondition): boolean {
  return condition.conditionType === 'SingleCondition' || (
    condition.operator === 'AND' && condition.conditions.every(isConjunction)
  );
}

function assertCandidateTreeIsValid(condition: QueryCondition): void {
  const soleRootOperator = matchingOperator(condition, SOLE_ROOT_CANDIDATE_OPERATORS);
  if (soleRootOperator !== null && condition.conditionType !== 'SingleCondition') {
    throw new Error(`${soleRootOperator} must be the sole root criterion`);
  }

  const approximateCandidateCount = countOperator(condition, 'CANDIDATES');
  if (approximateCandidateCount > 1) {
    throw new Error('A query may contain only one CANDIDATES criterion');
  }
  if (approximateCandidateCount === 1 && !isConjunction(condition)) {
    throw new Error('CANDIDATES can be combined only with non-negated AND predicates');
  }
}

/** Validate a prospective composition containing a bounded candidate operator. */
export function assertCandidateConditionIsComposable(
  existing: QueryCondition | null,
  incoming: QueryCondition,
  operator: 'AND' | 'OR' = 'AND',
): void {
  const prospective: QueryCondition = existing === null
    ? incoming
    : { conditionType: 'CompoundCondition', operator, conditions: [existing, incoming] };
  assertCandidateTreeIsValid(prospective);
}

/**
 * A high-level SEARCH can coexist with ordinary structured filters, but it is
 * the only full-text predicate allowed in the tree and may appear at most once.
 */
export function assertSearchConditionIsComposable(
  existing: QueryCondition | null,
  incoming: QueryCondition,
): void {
  const existingSummary = existing === null
    ? { searchCount: 0, fullTextCriteriaCount: 0, invalidSearchTargetCount: 0 }
    : summarizeFullTextSearch(existing);
  const incomingSummary = summarizeFullTextSearch(incoming);
  if (existingSummary.invalidSearchTargetCount + incomingSummary.invalidSearchTargetCount > 0) {
    throw new Error('SEARCH must target __full_text__');
  }
  const searchCount = existingSummary.searchCount + incomingSummary.searchCount;

  if (searchCount > 1) {
    throw new Error('SEARCH may appear at most once in a query');
  }

  const fullTextCriteriaCount =
    existingSummary.fullTextCriteriaCount + incomingSummary.fullTextCriteriaCount;
  if (searchCount === 1 && fullTextCriteriaCount > 1) {
    throw new Error('SEARCH cannot be combined with another __full_text__ criterion');
  }
}

/** Reject update/delete execution for the core's read-only candidate plans. */
export function assertCandidateConditionIsReadOnly(condition: QueryCondition | null): void {
  if (condition === null) return;
  const operator = matchingOperator(condition, READ_ONLY_SEARCH_OPERATORS);
  if (operator !== null) {
    if (operator === 'SEARCH') {
      throw new Error('SEARCH is a read-only search operation');
    }
    throw new Error(`${operator} is a read-only approximate admission operation`);
  }
}

/** Reject high-level and candidate-admission plans from live query streams. */
export function assertSearchConditionSupportsStreaming(condition: QueryCondition | null): void {
  if (condition === null) return;
  const operator = matchingOperator(condition, READ_ONLY_SEARCH_OPERATORS);
  if (operator !== null) {
    throw new Error(`${operator} cannot be used with live query streams`);
  }
}
