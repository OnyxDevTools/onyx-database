# Change: point gen-onyx.sh to repo schema default

- Date: 2025-12-24 10:33 AM PT
- Author/Agent: codex
- Scope: tooling
- Type: chore
- Summary:
  - default the helper script to use the repo's onyx.schema.json
  - keep dual default outputs (./onyx-ui/types.ts, ./onyx-api/types.ts), still comma-separated and overridable
  - resolve schema path relative to repo root for reliable use
- Impact:
  tooling only; no runtime behavior changes.
- Follow-ups:
  none
