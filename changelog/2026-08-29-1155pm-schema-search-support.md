# Change: Expose per-entity search capabilities in schema APIs

- Date: 2026-08-29 11:55 PM MT
- Author/Agent: Codex
- Scope: lib | docs
- Type: feature
- Summary:
  - Bump `@onyx.dev/onyx-database` from 2.7.0 to 2.8.0 for the additive schema capability contract.
  - Add typed `SchemaEntity.searchSupport` values for lexical, semantic, or combined search indexing.
  - Include entity type and effective search capability changes in schema diffs.
  - Document the backward-compatible `BOTH` default and index-rebuild behavior.

- Impact:
  - Schema authors can configure and round-trip the same search capability contract exposed by Onyx Database and Onyx Cloud; the release is ready for a new `v2.8.0` tag after the stack is deployed.
