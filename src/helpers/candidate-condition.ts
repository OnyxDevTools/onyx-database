import type { QueryCondition } from '../types/protocol';
import type { QueryCriteriaOperator } from '../types/common';

const SOLE_ROOT_CANDIDATE_OPERATORS = new Set<QueryCriteriaOperator>([
  'CANDIDATES',
  'SEARCH_CANDIDATES',
  'HNSW_CANDIDATES',
]);

function candidateOperator(condition: QueryCondition): QueryCriteriaOperator | null {
  if (condition.conditionType === 'SingleCondition') {
    return SOLE_ROOT_CANDIDATE_OPERATORS.has(condition.criteria.operator)
      ? condition.criteria.operator
      : null;
  }
  for (const child of condition.conditions) {
    const operator = candidateOperator(child);
    if (operator !== null) return operator;
  }
  return null;
}

/**
 * Enforce the wire contract that an approximate admission operator is the one
 * and only root criterion, including when a condition builder already contains
 * a nested compound tree.
 */
export function assertCandidateConditionIsSoleRoot(
  existing: QueryCondition | null,
  incoming: QueryCondition,
): void {
  const existingCandidate = existing === null ? null : candidateOperator(existing);
  const incomingCandidate = candidateOperator(incoming);
  const incomingIsSoleCandidate =
    existing === null &&
    incoming.conditionType === 'SingleCondition' &&
    incomingCandidate !== null;

  if (!incomingIsSoleCandidate && (existingCandidate !== null || incomingCandidate !== null)) {
    throw new Error(`${existingCandidate ?? incomingCandidate} must be the sole root criterion`);
  }
}

/** Reject update/delete execution for the core's read-only candidate plans. */
export function assertCandidateConditionIsReadOnly(condition: QueryCondition | null): void {
  if (condition === null) return;
  const operator = candidateOperator(condition);
  if (operator !== null) {
    throw new Error(`${operator} is a read-only approximate admission operation`);
  }
}
