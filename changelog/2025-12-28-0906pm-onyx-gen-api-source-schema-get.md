# Change: fetch schema via onyx.getSchema for --source api

- Date: 2025-12-28 09:06 PM PT
- Author/Agent: Codex
- Scope: cli
- Type: fix
- Summary:
  - update `onyx-gen --source api` to call the Schema API via `onyx.getSchema` (same as `onyx-schema get`)
  - normalize Schema API responses to introspection format, covering mixed data types
  - add tests for API-source generation and document the behavior in README
- Impact:
  - avoids failures when schema files come from the Schema API; no public API changes
- Follow-ups:
  - none
