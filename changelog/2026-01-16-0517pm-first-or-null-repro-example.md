# Change: firstOrNull without where example

- Date: 2026-01-16 05:17 PM PT
- Author/Agent: Codex
- Scope: examples
- Type: test
- Summary:
  - Added `examples/query/first-or-null-all-data.ts` as a tutorial showing `firstOrNull()` without a `where()` clause, ordered by `createdAt`.
  - Included the example in `scripts/run-examples.sh` for regression coverage.
  - Verified the script seeds a user and returns data without requiring `where()`.

- Impact:
  - Demonstrates and validates `firstOrNull` without `where()` alongside automated examples.

- Follow-ups:
  - Keep aligned with any future `firstOrNull()` behavior changes.
