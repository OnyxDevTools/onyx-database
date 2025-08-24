[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / IOnyxDatabase

# Interface: IOnyxDatabase\<Schema\>

Defined in: types/public.ts:13

## Type Parameters

### Schema

`Schema` = `Record`\<`string`, `unknown`\>

## Methods

### cascade()

> **cascade**(...`relationships`): [`ICascadeBuilder`](ICascadeBuilder.md)\<`Schema`\>

Defined in: types/public.ts:16

#### Parameters

##### relationships

...`string`[]

#### Returns

[`ICascadeBuilder`](ICascadeBuilder.md)\<`Schema`\>

***

### close()

> **close**(): `void`

Defined in: types/public.ts:42

Cancels active streams; safe to call multiple times

#### Returns

`void`

***

### delete()

> **delete**(`table`, `primaryKey`, `options?`): `Promise`\<`unknown`\>

Defined in: types/public.ts:31

#### Parameters

##### table

`string`

##### primaryKey

`string`

##### options?

###### partition?

`string`

###### relationships?

`string`[]

#### Returns

`Promise`\<`unknown`\>

***

### deleteDocument()

> **deleteDocument**(`documentId`): `Promise`\<`unknown`\>

Defined in: types/public.ts:39

#### Parameters

##### documentId

`string`

#### Returns

`Promise`\<`unknown`\>

***

### findById()

> **findById**\<`Table`, `T`\>(`table`, `primaryKey`, `options?`): `Promise`\<`T`\>

Defined in: types/public.ts:25

#### Type Parameters

##### Table

`Table` *extends* `string`

##### T

`T` = `Schema`\[`Table`\]

#### Parameters

##### table

`Table`

##### primaryKey

`string`

##### options?

###### partition?

`string`

###### resolvers?

`string`[]

#### Returns

`Promise`\<`T`\>

***

### from()

> **from**\<`Table`\>(`table`): [`IQueryBuilder`](IQueryBuilder.md)\<`Schema`\[`Table`\]\>

Defined in: types/public.ts:14

#### Type Parameters

##### Table

`Table` *extends* `string`

#### Parameters

##### table

`Table`

#### Returns

[`IQueryBuilder`](IQueryBuilder.md)\<`Schema`\[`Table`\]\>

***

### getDocument()

> **getDocument**(`documentId`, `options?`): `Promise`\<`unknown`\>

Defined in: types/public.ts:38

#### Parameters

##### documentId

`string`

##### options?

###### height?

`number`

###### width?

`number`

#### Returns

`Promise`\<`unknown`\>

***

### save()

#### Call Signature

> **save**\<`Table`\>(`table`): [`ISaveBuilder`](ISaveBuilder.md)\<`Schema`\[`Table`\]\>

Defined in: types/public.ts:18

##### Type Parameters

###### Table

`Table` *extends* `string`

##### Parameters

###### table

`Table`

##### Returns

[`ISaveBuilder`](ISaveBuilder.md)\<`Schema`\[`Table`\]\>

#### Call Signature

> **save**\<`Table`\>(`table`, `entityOrEntities`, `options?`): `Promise`\<`unknown`\>

Defined in: types/public.ts:19

##### Type Parameters

###### Table

`Table` *extends* `string`

##### Parameters

###### table

`Table`

###### entityOrEntities

`Partial`\<`Schema`\[`Table`\]\> | `Partial`\<`Schema`\[`Table`\]\>[]

###### options?

###### relationships?

`string`[]

##### Returns

`Promise`\<`unknown`\>

***

### saveDocument()

> **saveDocument**(`doc`): `Promise`\<`unknown`\>

Defined in: types/public.ts:37

#### Parameters

##### doc

[`OnyxDocument`](OnyxDocument.md)

#### Returns

`Promise`\<`unknown`\>

***

### select()

> **select**(...`fields`): [`IQueryBuilder`](IQueryBuilder.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: types/public.ts:15

#### Parameters

##### fields

...`string`[]

#### Returns

[`IQueryBuilder`](IQueryBuilder.md)\<`Record`\<`string`, `unknown`\>\>
