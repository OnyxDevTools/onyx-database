[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / ISaveBuilder

# Interface: ISaveBuilder\<T\>

Defined in: types/builders.ts:42

## Type Parameters

### T

`T` = `unknown`

## Methods

### cascade()

> **cascade**(...`relationships`): `ISaveBuilder`\<`T`\>

Defined in: types/builders.ts:43

#### Parameters

##### relationships

...`string`[]

#### Returns

`ISaveBuilder`\<`T`\>

***

### many()

> **many**(`entities`): `Promise`\<`unknown`\>

Defined in: types/builders.ts:45

#### Parameters

##### entities

`Partial`\<`T`\>[]

#### Returns

`Promise`\<`unknown`\>

***

### one()

> **one**(`entity`): `Promise`\<`unknown`\>

Defined in: types/builders.ts:44

#### Parameters

##### entity

`Partial`\<`T`\>

#### Returns

`Promise`\<`unknown`\>
