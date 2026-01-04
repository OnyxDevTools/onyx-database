# Change: broaden inOp to any query builder type

- Date: 2026-01-03 04:59 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - Added overloads to `inOp` so any `IQueryBuilder<T>` (including selects returning `Record<string, unknown>`) is accepted, preventing TypeScript errors in examples that nest queries.

- Impact:
  Type-safety improved for inner-query examples; runtime unchanged.

- Follow-ups:
  None.
