[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / IConditionBuilder

# Interface: IConditionBuilder

Defined in: types/builders.ts:5

## Methods

### and()

> **and**(`condition`): `IConditionBuilder`

Defined in: types/builders.ts:6

#### Parameters

##### condition

[`QueryCriteria`](QueryCriteria.md) | `IConditionBuilder`

#### Returns

`IConditionBuilder`

***

### or()

> **or**(`condition`): `IConditionBuilder`

Defined in: types/builders.ts:7

#### Parameters

##### condition

[`QueryCriteria`](QueryCriteria.md) | `IConditionBuilder`

#### Returns

`IConditionBuilder`

***

### toCondition()

> **toCondition**(): [`QueryCondition`](../type-aliases/QueryCondition.md)

Defined in: types/builders.ts:8

#### Returns

[`QueryCondition`](../type-aliases/QueryCondition.md)
