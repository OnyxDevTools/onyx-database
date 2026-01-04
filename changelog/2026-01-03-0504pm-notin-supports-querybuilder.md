# Change: allow notIn to accept query builders

- Date: 2026-01-03 05:04 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - Added overloads to `notIn` so nested `IQueryBuilder` instances (and string lists) are accepted, aligning with inner query support.
  - Extended helper tests to cover new branches and keep coverage at 100%.

- Impact:
  Type correctness for `notIn` with sub-queries; runtime behavior unchanged.

- Follow-ups:
  None.
