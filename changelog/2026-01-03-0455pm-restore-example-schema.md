# Change: restore example schema tables

- Date: 2026-01-03 04:55 PM PT
- Author/Agent: Codex
- Scope: examples
- Type: fix
- Summary:
  - Replaced the examples schema with the original user/role model so all documented tables (User, Role, etc.) exist again.
  - Regenerated `examples/onyx/types.ts` to match, fixing TypeScript errors in example imports.

- Impact:
  Examples build and type-check with the restored schema; runtime unaffected.

- Follow-ups:
  None.
