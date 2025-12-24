# Change: add multi-output support and defaults for onyx-gen

- Date: 2025-12-24 10:29 AM PT
- Author/Agent: codex
- Scope: cli
- Type: feat
- Summary:
  - allow multiple output targets via comma-separated --out/--types-out/--types-file flags
  - default onyx-gen (no flags) to source=./onyx.schema.json and out=./onyx/types.ts
  - document defaults and multi-output usage, and update helper script to accept comma-separated outputs
- Impact:
  behavior change for default invocation; no runtime dependencies added.
- Follow-ups:
  none
