# Change: Default entity transport to MessagePack

- Date: 2026-09-03 11:27 PM MT
- Author/Agent: Codex
- Scope: lib, docs
- Type: feat
- Summary:
  - Use MessagePack by default for entity CRUD, queries, and query streams in Node and edge clients.
  - Preserve `wireFormat: 'json'` as an explicit compatibility override and keep non-entity APIs on JSON.
  - Align facade cache identities for implicit and explicit MessagePack configurations.

- Impact:
  - Clients without an explicit `wireFormat` now send entity requests as `application/vnd.msgpack`; deployments without MessagePack support must select JSON explicitly.

- Follow-ups:
  - None.
