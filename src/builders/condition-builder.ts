// filename: src/builders/condition-builder.ts
import type { IConditionBuilder } from '../types/builders';
import type { QueryCondition, QueryCriteria } from '../types/protocol';
import type { LogicalOperator } from '../types/common';

/** Builder for combining query conditions with logical operators. */
export class ConditionBuilderImpl implements IConditionBuilder {
  private condition: QueryCondition | null;

  /**
   * Initialize with an optional starting criteria.
   *
   * @param criteria Initial query criteria to seed the builder.
   * @example
   * ```ts
   * const builder = new ConditionBuilderImpl({ field: 'id', operator: 'eq', value: '1' });
   * ```
   */
  constructor(criteria: QueryCriteria | null = null) {
    this.condition = criteria ? this.single(criteria) : null;
  }

  /**
   * Add a criteria combined with AND.
   *
   * @param condition Another builder or raw criteria to AND.
   * @example
   * ```ts
   * builder.and({ field: 'name', operator: 'eq', value: 'Ada' });
   * ```
   */
  and(condition: IConditionBuilder | QueryCriteria): IConditionBuilder {
    this.addCompound('AND', this.prepare(condition));
    return this;
  }

  /**
   * Add a criteria combined with OR.
   *
   * @param condition Another builder or raw criteria to OR.
   * @example
   * ```ts
   * builder.or({ field: 'status', operator: 'eq', value: 'active' });
   * ```
   */
  or(condition: IConditionBuilder | QueryCriteria): IConditionBuilder {
    this.addCompound('OR', this.prepare(condition));
    return this;
  }

  /**
   * Produce the composed QueryCondition.
   *
   * @example
   * ```ts
   * const condition = builder.toCondition();
   * ```
   */
  toCondition(): QueryCondition {
    if (!this.condition) {
      throw new Error('ConditionBuilder has no criteria.');
    }
    return this.condition;
  }

  /**
   * Wrap raw criteria into a single condition object.
   *
   * @param criteria Criteria to wrap.
   * @example
   * ```ts
   * builder['single']({ field: 'id', operator: 'eq', value: '1' });
   * ```
   */
  private single(criteria: QueryCriteria): QueryCondition {
    return { conditionType: 'SingleCondition', criteria };
  }

  /**
   * Create a compound condition using the provided operator.
   *
   * @param operator Logical operator to apply.
   * @param conditions Child conditions to combine.
   * @example
   * ```ts
   * builder['compound']('AND', [condA, condB]);
   * ```
   */
  private compound(operator: LogicalOperator, conditions: QueryCondition[]): QueryCondition {
    return { conditionType: 'CompoundCondition', operator, conditions };
  }

  /**
   * Merge the next condition into the existing tree using the operator.
   *
   * @param operator Logical operator for the merge.
   * @param next Condition to merge into the tree.
   * @example
   * ```ts
   * builder['addCompound']('AND', someCondition);
   * ```
   */
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

  /**
   * Normalize input into a QueryCondition instance.
   *
   * @param condition Builder or raw criteria to normalize.
   * @example
   * ```ts
   * const qc = builder['prepare']({ field: 'id', operator: 'eq', value: '1' });
   * ```
   */
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
