[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / IOnyxDatabase

# Interface: IOnyxDatabase\<Schema\>

Defined in: types/public.ts:18

## Type Parameters

### Schema

`Schema` = `Record`\<`string`, `unknown`\>

## Methods

### cascade()

> **cascade**(...`relationships`): [`ICascadeBuilder`](ICascadeBuilder.md)\<`Schema`\>

Defined in: types/public.ts:21

#### Parameters

##### relationships

...`string`[]

#### Returns

[`ICascadeBuilder`](ICascadeBuilder.md)\<`Schema`\>

***

### cascadeBuilder()

> **cascadeBuilder**(): [`ICascadeRelationshipBuilder`](ICascadeRelationshipBuilder.md)

Defined in: types/public.ts:22

#### Returns

[`ICascadeRelationshipBuilder`](ICascadeRelationshipBuilder.md)

***

### close()

> **close**(): `void`

Defined in: types/public.ts:48

Cancels active streams; safe to call multiple times

#### Returns

`void`

***

### delete()

> **delete**\<`Table`, `T`\>(`table`, `primaryKey`, `options?`): `Promise`\<`T`\>

Defined in: types/public.ts:37

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

###### relationships?

`string`[]

#### Returns

`Promise`\<`T` \| `null`\>

***

### deleteDocument()

> **deleteDocument**(`documentId`): `Promise`\<`unknown`\>

Defined in: types/public.ts:45

#### Parameters

##### documentId

`string`

#### Returns

`Promise`\<`unknown`\>

***

### batchSave()

> **batchSave**\<`Table`\>(`table`, `entities`, `batchSize?`, `options?`): `Promise`\<`void`\>

Defined in: types/public.ts:27

#### Type Parameters

##### Table

`Table` *extends* `string`

#### Parameters

##### table

`Table`

##### entities

`Partial`\<`Schema`\[`Table`\]\>[]

##### batchSize?

`number`

##### options?

###### relationships?

`string`[]

#### Returns

`Promise`\<`void`\>

***

### findById()

> **findById**\<`Table`, `T`\>(`table`, `primaryKey`, `options?`): `Promise`\<`T` \| `null`\>

Defined in: types/public.ts:31

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

Defined in: types/public.ts:19

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

Defined in: types/public.ts:44

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

Defined in: types/public.ts:24

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

Defined in: types/public.ts:25

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

Defined in: types/public.ts:43

#### Parameters

##### doc

[`OnyxDocument`](OnyxDocument.md)

#### Returns

`Promise`\<`unknown`\>

***

### select()

> **select**(...`fields`): [`IQueryBuilder`](IQueryBuilder.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: types/public.ts:20

#### Parameters

##### fields

...`string`[]

#### Returns

[`IQueryBuilder`](IQueryBuilder.md)\<`Record`\<`string`, `unknown`\>\>
