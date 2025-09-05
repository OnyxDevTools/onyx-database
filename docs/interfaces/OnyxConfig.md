[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / OnyxConfig

# Interface: OnyxConfig

Defined in: types/public.ts:10

## Properties

### apiKey?

> `optional` **apiKey**: `string`

Defined in: types/public.ts:13

***

### apiSecret?

> `optional` **apiSecret**: `string`

Defined in: types/public.ts:14

***

### baseUrl?

> `optional` **baseUrl**: `string`

Defined in: types/public.ts:11

***

### databaseId?

> `optional` **databaseId**: `string`

Defined in: types/public.ts:12

***

### fetch?

> `optional` **fetch**: [`FetchImpl`](../type-aliases/FetchImpl.md)

Defined in: types/public.ts:15

***

### partition?

> `optional` **partition**: `string`

Default partition for queries, `findById`, and `delete` by primary key. Saves
use the entity's partition field.

Defined in: types/public.ts:16
