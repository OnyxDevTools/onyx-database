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

> **delete**\<`Table`\>(`table`, `primaryKey`): `Promise`\<`Schema`\[`Table`\]\>

Defined in: types/builders.ts:54

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
