[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / FetchResponse

# Interface: FetchResponse

Defined in: types/common.ts:30

Minimal fetch typing to avoid DOM lib dependency

## Properties

### body?

> `optional` **body**: `unknown`

Defined in: types/common.ts:37

raw body for streams; left as unknown to avoid DOM typings

***

### headers

> **headers**: `object`

Defined in: types/common.ts:34

#### get()

> **get**(`name`): `null` \| `string`

##### Parameters

###### name

`string`

##### Returns

`null` \| `string`

***

### ok

> **ok**: `boolean`

Defined in: types/common.ts:31

***

### status

> **status**: `number`

Defined in: types/common.ts:32

***

### statusText

> **statusText**: `string`

Defined in: types/common.ts:33

## Methods

### text()

> **text**(): `Promise`\<`string`\>

Defined in: types/common.ts:35

#### Returns

`Promise`\<`string`\>
