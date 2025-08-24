import { describe, it, expect } from 'vitest';
import { ConditionBuilderImpl } from '../src/builders/condition-builder';

describe('ConditionBuilderImpl', () => {
  it('builds compound conditions with and/or', () => {
    const cb = new ConditionBuilderImpl();
    const other = new ConditionBuilderImpl({ field: 'b', operator: 'EQUAL', value: 2 });

    cb.and({ field: 'a', operator: 'EQUAL', value: 1 })
      .and(other)
      .and({ field: 'd', operator: 'EQUAL', value: 4 })
      .or({ field: 'c', operator: 'EQUAL', value: 3 });

    expect(cb.toCondition()).toEqual({
      conditionType: 'CompoundCondition',
      operator: 'OR',
      conditions: [
        {
          conditionType: 'CompoundCondition',
          operator: 'AND',
          conditions: [
            { conditionType: 'SingleCondition', criteria: { field: 'a', operator: 'EQUAL', value: 1 } },
            { conditionType: 'SingleCondition', criteria: { field: 'b', operator: 'EQUAL', value: 2 } },
            { conditionType: 'SingleCondition', criteria: { field: 'd', operator: 'EQUAL', value: 4 } }
          ]
        },
        { conditionType: 'SingleCondition', criteria: { field: 'c', operator: 'EQUAL', value: 3 } }
      ]
    });
  });

  it('throws when no criteria or invalid input', () => {
    const empty = new ConditionBuilderImpl();
    expect(() => empty.toCondition()).toThrow('ConditionBuilder has no criteria.');
    expect(() => empty.and({} as any)).toThrow('Invalid condition');
  });
});
