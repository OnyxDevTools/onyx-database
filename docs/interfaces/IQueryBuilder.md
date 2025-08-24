[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / IQueryBuilder

# Interface: IQueryBuilder\<T\>

Defined in: types/builders.ts:11

## Type Parameters

### T

`T` = `unknown`

## Methods

### and()

> **and**(`condition`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:16

#### Parameters

##### condition

[`QueryCriteria`](QueryCriteria.md) | [`IConditionBuilder`](IConditionBuilder.md)

#### Returns

`IQueryBuilder`\<`T`\>

***

### count()

> **count**(): `Promise`\<`number`\>

Defined in: types/builders.ts:27

#### Returns

`Promise`\<`number`\>

***

### delete()

> **delete**(): `Promise`\<`unknown`\>

Defined in: types/builders.ts:35

#### Returns

`Promise`\<`unknown`\>

***

### distinct()

> **distinct**(): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:20

#### Returns

`IQueryBuilder`\<`T`\>

***

### from()

> **from**(`table`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:12

#### Parameters

##### table

`string`

#### Returns

`IQueryBuilder`\<`T`\>

***

### groupBy()

> **groupBy**(...`fields`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:19

#### Parameters

##### fields

...`string`[]

#### Returns

`IQueryBuilder`\<`T`\>

***

### inPartition()

> **inPartition**(`partition`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:22

#### Parameters

##### partition

`string`

#### Returns

`IQueryBuilder`\<`T`\>

***

### limit()

> **limit**(`n`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:21

#### Parameters

##### n

`number`

#### Returns

`IQueryBuilder`\<`T`\>

***

### list()

> **list**(`options?`): `Promise`\<`T`[]\>

Defined in: types/builders.ts:28

#### Parameters

##### options?

###### nextPage?

`string`

###### pageSize?

`number`

#### Returns

`Promise`\<`T`[]\>

***

### firstOrNull()

> **firstOrNull**(): `Promise`\<`T` | `null`\>

Defined in: types/builders.ts:29

#### Returns

`Promise`\<`T` | `null`\>

***

### one()

> **one**(): `Promise`\<`T` | `null`\>

Defined in: types/builders.ts:30

#### Returns

`Promise`\<`T` | `null`\>

***

### nextPage()

> **nextPage**(`token`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:25

#### Parameters

##### token

`string`

#### Returns

`IQueryBuilder`\<`T`\>

***

### onItem()

> **onItem**(`listener`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:38

#### Parameters

##### listener

(`entity`, `action`) => `void`

#### Returns

`IQueryBuilder`\<`T`\>

***

### onItemAdded()

> **onItemAdded**(`listener`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:35

#### Parameters

##### listener

(`entity`) => `void`

#### Returns

`IQueryBuilder`\<`T`\>

***

### onItemDeleted()

> **onItemDeleted**(`listener`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:37

#### Parameters

##### listener

(`entity`) => `void`

#### Returns

`IQueryBuilder`\<`T`\>

***

### onItemUpdated()

> **onItemUpdated**(`listener`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:36

#### Parameters

##### listener

(`entity`) => `void`

#### Returns

`IQueryBuilder`\<`T`\>

***

### or()

> **or**(`condition`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:17

#### Parameters

##### condition

[`QueryCriteria`](QueryCriteria.md) | [`IConditionBuilder`](IConditionBuilder.md)

#### Returns

`IQueryBuilder`\<`T`\>

***

### orderBy()

> **orderBy**(...`sorts`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:18

#### Parameters

##### sorts

...[`Sort`](Sort.md)[]

#### Returns

`IQueryBuilder`\<`T`\>

***

### page()

> **page**(`options?`): `Promise`\<\{ `nextPage?`: `null` \| `string`; `records`: `T`[]; \}\>

Defined in: types/builders.ts:31

#### Parameters

##### options?

###### nextPage?

`string`

###### pageSize?

`number`

#### Returns

`Promise`\<\{ `nextPage?`: `null` \| `string`; `records`: `T`[]; \}\>

***

### pageSize()

> **pageSize**(`n`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:24

#### Parameters

##### n

`number`

#### Returns

`IQueryBuilder`\<`T`\>

***

### resolve()

> **resolve**(`values`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:14

#### Parameters

##### values

`string` | `string`[]

#### Returns

`IQueryBuilder`\<`T`\>

***

### selectFields()

> **selectFields**(`fields`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:13

#### Parameters

##### fields

`string`[]

#### Returns

`IQueryBuilder`\<`T`\>

***

### setUpdates()

> **setUpdates**(`updates`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:33

#### Parameters

##### updates

`Partial`\<`T`\>

#### Returns

`IQueryBuilder`\<`T`\>

***

### stream()

> **stream**(`includeQueryResults?`, `keepAlive?`): `Promise`\<\{ `cancel`: () => `void`; \}\>

Defined in: types/builders.ts:39

#### Parameters

##### includeQueryResults?

`boolean`

##### keepAlive?

`boolean`

#### Returns

`Promise`\<\{ `cancel`: () => `void`; \}\>

***

### update()

> **update**(): `Promise`\<`unknown`\>

Defined in: types/builders.ts:34

#### Returns

`Promise`\<`unknown`\>

***

### where()

> **where**(`condition`): `IQueryBuilder`\<`T`\>

Defined in: types/builders.ts:15

#### Parameters

##### condition

[`QueryCriteria`](QueryCriteria.md) | [`IConditionBuilder`](IConditionBuilder.md)

#### Returns

`IQueryBuilder`\<`T`\>
