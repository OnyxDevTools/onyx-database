# Change: Use single schema source for examples

- Date: 2026-01-08 03:32 PM PST
- Author/Agent: Codex
- Scope: examples
- Type: chore
- Summary:
  - remove duplicate `examples/onyx.schema.json` and point example codegen to the root `onyx.schema.json`
  - avoid diverging schemas between root and examples

- Impact:
  Examples only; no SDK/CLI changes.

- Follow-ups:
  None.
