# Change: allow firstOrNull without where

- Date: 2026-01-16 05:29 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - Removed the `where()` requirement from `firstOrNull()` in both builder implementations so it can be used with simple order/limit queries.
  - Added a seeded example (`examples/query/first-or-null-missing-where.ts`) and wired it into `scripts/run-examples.sh` to guard the behavior.
  - Ensured the example now asserts a record is returned when invoked without `where()`.

- Impact:
  - Public behavior: `firstOrNull()` no longer throws when no `where()` clause is present; existing `where()` flows remain unchanged.

- Follow-ups:
  - None noted.
