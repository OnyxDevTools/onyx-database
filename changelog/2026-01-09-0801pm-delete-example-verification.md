# Change: Harden delete example verification

- Date: 2026-01-09 08:01 PM PT
- Author/Agent: Codex
- Scope: examples
- Type: fix
- Summary:
  - Allow `examples/delete/by-id.ts` to handle empty delete responses by verifying the record is gone.
  - Keep the example user-facing while still erroring when deletion does not take effect.

- Impact:
  - Example correctness only; no SDK or CLI behavior changes.

- Follow-ups:
  - None.
