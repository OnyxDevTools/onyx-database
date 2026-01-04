import type { QueryCondition } from '../types/protocol';

type QueryBuilderLike = { toSerializableQueryObject: () => unknown };

function isQueryBuilderLike(value: unknown): value is QueryBuilderLike {
  return !!value && typeof (value as QueryBuilderLike).toSerializableQueryObject === 'function';
}

function normalizeCriteriaValue(value: unknown): { value: unknown; changed: boolean } {
  if (Array.isArray(value)) {
    let changed = false;
    const normalized = value.map((item) => {
      const result = normalizeCriteriaValue(item);
      if (result.changed) changed = true;
      return result.value;
    });
    if (!changed) {
      for (let i = 0; i < normalized.length; i += 1) {
        if (normalized[i] !== value[i]) {
          changed = true;
          break;
        }
      }
    }
    return { value: changed ? normalized : value, changed };
  }
  if (isQueryBuilderLike(value)) {
    return { value: value.toSerializableQueryObject(), changed: true };
  }
  return { value, changed: false };
}

function normalizeConditionInternal(condition: QueryCondition): QueryCondition {
  if (condition.conditionType === 'SingleCondition') {
    const { value, changed } = normalizeCriteriaValue(condition.criteria.value);
    if (!changed) return condition;
    return {
      ...condition,
      criteria: { ...condition.criteria, value },
    };
  }
  let changed = false;
  const normalizedConditions = condition.conditions.map((child) => {
    const normalized = normalizeConditionInternal(child);
    if (normalized !== child) changed = true;
    return normalized;
  });
  if (!changed) return condition;
  return { ...condition, conditions: normalizedConditions };
}

export function normalizeCondition(condition: QueryCondition | null): QueryCondition | null {
  if (!condition) return condition;
  return normalizeConditionInternal(condition);
}
