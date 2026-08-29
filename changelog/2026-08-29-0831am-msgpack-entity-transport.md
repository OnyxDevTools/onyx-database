# Change: add opt-in MessagePack entity transport

- Date: 2026-08-29 08:31 AM MDT
- Author/Agent: Codex
- Scope: lib, docs, test
- Type: feat
- Summary:
  - add a bounded, zero-runtime-dependency MessagePack codec for recursive entity and query values
  - negotiate MessagePack for entity CRUD, unary queries, and self-delimiting query streams while retaining JSON fallback handling
  - document `OnyxConfig.wireFormat` and cover the transport with shared golden vectors and compatibility tests

- Impact:
  - adds the optional public `wireFormat: 'json' | 'msgpack'` configuration; JSON remains the default
  - widens custom fetch request bodies to `string | Uint8Array` and adds optional binary response access through `arrayBuffer()`
  - documents stay on JSON and no runtime dependency is added

- Follow-ups:
  - publish cross-language and end-to-end benchmark results with the coordinated server/client release
