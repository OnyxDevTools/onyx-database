[**@onyx.dev/onyx-database**](../README.md)

***

[@onyx.dev/onyx-database](../globals.md) / OnyxFacade

# Interface: OnyxFacade

Defined in: types/public.ts:51

## Methods

### init()

> **init**\<`Schema`\>(`config?`): [`IOnyxDatabase`](IOnyxDatabase.md)\<`Schema`\>

Defined in: types/public.ts:52

#### Type Parameters

##### Schema

`Schema` = `Record`\<`string`, `unknown`\>

#### Parameters

##### config?

[`OnyxConfig`](OnyxConfig.md)

#### Returns

[`IOnyxDatabase`](IOnyxDatabase.md)\<`Schema`\>

#### Remarks

Each returned client resolves configuration once and maintains a single internal
HTTP handler. Requests use Node's `fetch`, which keeps connections alive and
pools them, so extra connection caching is rarely required.
