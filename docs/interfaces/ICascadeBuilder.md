[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / ICascadeBuilder

# Interface: ICascadeBuilder\<Schema\>

Defined in: types/builders.ts:315

Helper for constructing cascade relationship strings. Partition values are
managed by the database facade or by setting the partition field on entities.

## Type Parameters

### Schema

`Schema` = `Record`\<`string`, `unknown`\>

## Methods

### cascade()

> **cascade**(...`relationships`): `ICascadeBuilder`\<`Schema`\>

Defined in: types/builders.ts:323

#### Parameters

##### relationships

...`string`[]

#### Returns

`ICascadeBuilder`\<`Schema`\>

***

### delete()

> **delete**\<`Table`\>(`table`, `primaryKey`): `Promise`\<`Schema`\[`Table`\]\>

Defined in: types/builders.ts:339

#### Type Parameters

##### Table

`Table` *extends* `string`

#### Parameters

##### table

`Table`


##### primaryKey

`string`

#### Returns

`Promise`\<`Schema`\[`Table`\]\>

***

### save()

> **save**\<`Table`\>(`table`, `entityOrEntities`): `Promise`\<`unknown`\>

Defined in: types/builders.ts:327

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
