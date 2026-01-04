# Change: serialize inner query conditions

- Date: 2026-01-03 04:24 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - Normalize conditions to serialize nested query builders, including table metadata.
  - Ensure update/delete/select payloads send sub-query JSON instead of builder instances.
  - Added coverage around the condition normalizer and nested query helpers.

- Impact:
  Public API unchanged; nested queries now include table info when sent to the API.

- Follow-ups:
  None.
