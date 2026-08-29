# Change: support signed int64 values in MessagePack

- Date: 2026-08-29 09:06 AM MT
- Author/Agent: Codex
- Scope: lib, docs, test
- Type: fix
- Summary:
  - encode signed 64-bit bigint inputs and decode out-of-safe-range integers as bigint
  - retain safe-number validation and reject unsigned wire integers above Long.MAX_VALUE
  - make binary request and response logging bigint-safe and document the mapping

- Impact:
  - MessagePack entity values can now preserve the complete signed int64 range losslessly
  - JSON remains unable to serialize bigint values

- Follow-ups:
  - none
