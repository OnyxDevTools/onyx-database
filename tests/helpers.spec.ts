import { describe, it, expect, vi } from 'vitest';
import * as agg from '../src/helpers/aggregates';
import * as cond from '../src/helpers/conditions';
import * as sort from '../src/helpers/sort';
import { sanitizeBaseUrl } from '../src/config/defaults';
import { normalizeCondition } from '../src/helpers/condition-normalizer';
import type { QueryCondition } from '../src/types/protocol';
import { QueryBuilder } from '../src/builders/query-builder';

describe('helper utilities', () => {
  it('generates aggregate expressions', () => {
    agg.avg('a');
    agg.sum('a');
    agg.count('a');
    agg.min('a');
    agg.max('a');
    agg.std('a');
    agg.variance('a');
    agg.median('a');
    agg.upper('a');
    agg.lower('a');
    expect(agg.substring('name', 1, 2)).toBe('substring(name,1,2)');
    expect(agg.replace('col', "o'o", "r'r")).toBe("replace(col, 'o\\'o', 'r\\'r')");
    agg.percentile('a', 0.5);
  });

  it('provides condition builders', () => {
    // Execute every helper to ensure complete coverage
    cond.eq('a', 1).toCondition();
    cond.neq('a', 1);
    expect(cond.inOp('a', [1, 2]).toCondition().criteria.value).toEqual([1, 2]);
    expect(cond.inOp('a', 'b,c').toCondition().criteria.value).toEqual(['b', 'c']);
    cond.notIn('a', [1]);
    const qb = new QueryBuilder({} as any, 'tbl');
    expect(cond.inOp('a', qb).toCondition().criteria.value).toBe(qb);
    expect(cond.notIn('a', qb).toCondition().criteria.value).toBe(qb);
    expect(cond.notIn('a', 'd, e ').toCondition().criteria.value).toEqual(['d', 'e']);
    expect(cond.within('a', [9]).toCondition().criteria.value).toEqual([9]);
    expect(cond.notWithin('a', [10]).toCondition().criteria.value).toEqual([10]);
    cond.between('a', 1, 2);
    cond.gt('a', 1);
    cond.gte('a', 1);
    cond.lt('a', 1);
    cond.lte('a', 1);
    cond.matches('a', 're');
    expect(cond.search('query').toCondition().criteria.value).toEqual({ queryText: 'query', minScore: null });
    expect(cond.search('query', 1.1).toCondition().criteria.value).toEqual({ queryText: 'query', minScore: 1.1 });
    cond.notMatches('a', 're');
    cond.like('a', '%x%');
    cond.notLike('a', '%x%');
    cond.contains('a', 'x');
    cond.containsIgnoreCase('a', 'x');
    cond.notContains('a', 'x');
    cond.notContainsIgnoreCase('a', 'x');
    cond.startsWith('a', 'x');
    cond.notStartsWith('a', 'x');
    cond.isNull('a');
    cond.notNull('a');
  });

  it('creates sort helpers', () => {
    expect(sort.asc('a')).toEqual({ field: 'a', order: 'ASC' });
    expect(sort.desc('a')).toEqual({ field: 'a', order: 'DESC' });
  });

  it('sanitizes base URLs', () => {
    expect(sanitizeBaseUrl('https://api.onyx.dev//')).toBe('https://api.onyx.dev');
  });

  it('normalizes sub-queries inside conditions', () => {
    expect(normalizeCondition(null)).toBeNull();

    const untouchedSingle: QueryCondition = {
      conditionType: 'SingleCondition',
      criteria: { field: 'a', operator: 'EQUAL', value: [1, 2] },
    };
    expect(normalizeCondition(untouchedSingle)).toBe(untouchedSingle);

    const untouchedCompound: QueryCondition = {
      conditionType: 'CompoundCondition',
      operator: 'AND',
      conditions: [
        untouchedSingle,
        {
          conditionType: 'SingleCondition',
          criteria: { field: 'b', operator: 'EQUAL', value: 'x' },
        },
      ],
    };
    expect(normalizeCondition(untouchedCompound)).toBe(untouchedCompound);

    const nanCondition: QueryCondition = {
      conditionType: 'SingleCondition',
      criteria: { field: 'c', operator: 'EQUAL', value: [Number.NaN] },
    };
    const normalizedNan = normalizeCondition(nanCondition);
    expect(normalizedNan).not.toBe(nanCondition);
    expect(Number.isNaN((normalizedNan as any).criteria.value[0])).toBe(true);

    const qb = new QueryBuilder({} as any, 'tbl');
    const subQueryCondition: QueryCondition = {
      conditionType: 'CompoundCondition',
      operator: 'AND',
      conditions: [
        {
          conditionType: 'SingleCondition',
          criteria: { field: 'd', operator: 'IN', value: [qb, 3] },
        },
        {
          conditionType: 'SingleCondition',
          criteria: { field: 'e', operator: 'EQUAL', value: 'keep' },
        },
      ],
    };
    const normalized = normalizeCondition(subQueryCondition);
    expect(normalized).not.toBe(subQueryCondition);
    const [first, second] = (normalized as any).conditions;
    expect(first.criteria.value[0]).toMatchObject({ table: 'tbl', type: 'SelectQuery' });
    expect(second).toBe(subQueryCondition.conditions[1]);
    expect(
      (first.criteria.value[0] as { table: string; type: string }).table,
    ).toBe('tbl');

    const callable = { toSerializableQueryObject: vi.fn().mockReturnValue({ type: 'SelectQuery', table: 'custom' }) };
    const directBuilderCondition: QueryCondition = {
      conditionType: 'SingleCondition',
      criteria: { field: 'f', operator: 'EQUAL', value: callable },
    };
    const normalizedDirect = normalizeCondition(directBuilderCondition);
    expect(normalizedDirect).not.toBe(directBuilderCondition);
    expect((normalizedDirect as any).criteria.value).toEqual({ type: 'SelectQuery', table: 'custom' });
    expect(callable.toSerializableQueryObject).toHaveBeenCalledTimes(1);
  });
});
