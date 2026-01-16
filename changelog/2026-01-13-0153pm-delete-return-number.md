# Change: delete query returns count

- Date: 2026-01-13 01:53 PM PST
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - Make query-builder `delete()` and `deleteByQuery` return a typed `number` for deleted row count.
  - Updated delete examples to rely on the typed return without casts.
- Impact:
  - Public API now reports delete-by-query results as a number; consumers can drop type assertions.
- Follow-ups:
  - None.
