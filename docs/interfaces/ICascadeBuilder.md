[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / ICascadeBuilder

# Interface: ICascadeBuilder\<Schema\>

Defined in: types/builders.ts:48

## Type Parameters

### Schema

`Schema` = `Record`\<`string`, `unknown`\>

## Methods

### cascade()

> **cascade**(...`relationships`): `ICascadeBuilder`\<`Schema`\>

Defined in: types/builders.ts:49

#### Parameters

##### relationships

...`string`[]

#### Returns

`ICascadeBuilder`\<`Schema`\>

***

### delete()

> **delete**(`table`, `primaryKey`): `Promise`\<`unknown`\>

Defined in: types/builders.ts:54

#### Parameters

##### table

`string`

##### primaryKey

`string`

#### Returns

`Promise`\<`unknown`\>

***

### save()

> **save**\<`Table`\>(`table`, `entityOrEntities`): `Promise`\<`unknown`\>

Defined in: types/builders.ts:50

#### Type Parameters

##### Table

`Table` *extends* `string`

#### Parameters

##### table

`Table`

##### entityOrEntities

`Partial`\<`Schema`\[`Table`\]\> | `Partial`\<`Schema`\[`Table`\]\>[]

#### Returns

`Promise`\<`unknown`\>
