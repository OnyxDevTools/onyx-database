// filename: src/builders/condition-builder.ts
import type { IConditionBuilder } from '../types/builders';
import type { QueryCondition, QueryCriteria } from '../types/protocol';
import type { LogicalOperator } from '../types/common';

export class ConditionBuilderImpl implements IConditionBuilder {
  private condition: QueryCondition | null;

  constructor(criteria: QueryCriteria | null = null) {
    this.condition = criteria ? this.single(criteria) : null;
  }

  and(condition: IConditionBuilder | QueryCriteria): IConditionBuilder {
    this.addCompound('AND', this.prepare(condition));
    return this;
  }

  or(condition: IConditionBuilder | QueryCriteria): IConditionBuilder {
    this.addCompound('OR', this.prepare(condition));
    return this;
  }

  toCondition(): QueryCondition {
    if (!this.condition) {
      throw new Error('ConditionBuilder has no criteria.');
    }
    return this.condition;
  }

  private single(criteria: QueryCriteria): QueryCondition {
    return { conditionType: 'SingleCondition', criteria };
  }

  private compound(operator: LogicalOperator, conditions: QueryCondition[]): QueryCondition {
    return { conditionType: 'CompoundCondition', operator, conditions };
  }

  private addCompound(operator: LogicalOperator, next: QueryCondition): void {
    if (!this.condition) {
      this.condition = next;
      return;
    }
    if (this.condition.conditionType === 'CompoundCondition' && this.condition.operator === operator) {
      this.condition.conditions.push(next);
      return;
    }
    this.condition = this.compound(operator, [this.condition, next]);
  }

  private prepare(condition: IConditionBuilder | QueryCriteria): QueryCondition {
    if (typeof (condition as IConditionBuilder).toCondition === 'function') {
      return (condition as IConditionBuilder).toCondition();
    }
    const c = condition as QueryCriteria;
    if (c && typeof c.field === 'string' && typeof c.operator === 'string') {
      return this.single(c);
    }
    throw new Error('Invalid condition');
  }
}