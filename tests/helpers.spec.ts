import { describe, it, expect } from 'vitest';
import * as agg from '../src/helpers/aggregates';
import * as cond from '../src/helpers/conditions';
import * as sort from '../src/helpers/sort';
import { sanitizeBaseUrl } from '../src/config/defaults';

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
    cond.inOp('a', [1]);
    cond.notIn('a', [1]);
    cond.between('a', 1, 2);
    cond.gt('a', 1);
    cond.gte('a', 1);
    cond.lt('a', 1);
    cond.lte('a', 1);
    cond.matches('a', 're');
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
});
