# Change: make generated types deterministic

- Date: 2026-01-16 06:26 PM PT
- Author/Agent: Codex
- Scope: tooling
- Type: fix
- Summary:
  - Removed timestamp emission in `onyx-gen` output to keep `examples/onyx/types.ts` stable across runs.
  - Regenerated `examples/onyx/types.ts` without the timestamp header so bootstrap/scripts no longer dirty the working tree.

- Impact:
  - `examples/onyx/types.ts` stays unchanged unless the schema changes, avoiding git dirty state after running scripts.

- Follow-ups:
  - None.
