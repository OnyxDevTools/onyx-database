# Change: Add native bounded candidate search contracts

- Date: 2026-08-29 01:21 PM MT
- Author/Agent: Codex
- Scope: lib | docs | examples
- Type: feat
- Summary:
  - Add typed, validated wire helpers and fluent builders for `CANDIDATES`, `SEARCH_CANDIDATES`, and `HNSW_CANDIDATES`.
  - Preserve signed 64-bit calibration identifiers as strings and enforce server-compatible vector, route, result, and work bounds before transport.
  - Enforce candidate-only root composition and read-only execution, validate semantic mixed-radix buckets, and restore `NOT_BETWEEN` operator/helper parity.
  - Replace retired Lucene-facing schema types, documentation, and examples with native `VECTOR`/`SEARCHABLE` search.

- Impact:
  - Public additive candidate APIs are available in SDK 2.6.0; the no-longer-valid `LUCENE` schema type is removed from active TypeScript declarations.

- Follow-ups:
  - Publish 2.6.0 before deploying Cloud Admin consumers pinned to `^2.6.0`.
