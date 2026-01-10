# Change: Fix search-by-resolver-fields example

- Date: 2026-01-07 08:29 PM PST
- Author/Agent: Codex
- Scope: examples
- Type: fix
- Summary:
  - update `examples/query/search-by-resolver-fields.ts` to filter users by role name using subqueries (`inOp` + nested `select`) instead of resolver-field paths that the API rejects
  - keeps the resolver loading for roles while ensuring the query is valid

- Impact:
  Examples only; no SDK/CLI changes.

- Follow-ups:
  None.
