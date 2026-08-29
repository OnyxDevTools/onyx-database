# Native bounded candidate search client support

## Original task

Replace retired Lucene-facing SDK types and helpers with the native Onyx vector-managed candidate channels used by OnyxGemma: `CANDIDATES`, `SEARCH_CANDIDATES`, and `HNSW_CANDIDATES`.

## Plan

1. Add strict public wire payloads, limits, helpers, and builder methods for all three candidate channels.
2. Retire Lucene schema typing/documentation in favor of `VECTOR` and native vector-managed search.
3. Cover exact serialization and invalid/bounded input behavior with unit tests.
4. Run lint, typecheck, tests, and dual build; record the change.

## Acceptance criteria

- [x] Public query/operator types cover all three native candidate channels.
- [x] Typed helpers enforce server-compatible hard bounds plus sole-root and read-only candidate semantics.
- [x] Public schema types expose `DEFAULT | VECTOR`, not `LUCENE`.
- [x] Tests, lint, typecheck, and build pass.
