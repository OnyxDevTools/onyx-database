# Change: Add schema diff command

- Date: 2026-01-03 03:58 PM PT
- Author/Agent: Codex
- Scope: cli
- Type: feat
- Summary:
  - add `onyx-schema diff` to compare the API schema with a local file and show new/removed/changed tables
  - display field, index, resolver, and trigger changes in a readable summary instead of JSON diffs
  - cover diff logic with unit tests and reuse in the CLI

- Impact:
  New CLI command only; SDK API unchanged.

- Follow-ups:
  None.
