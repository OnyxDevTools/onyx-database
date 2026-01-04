# Change: remove `in` alias and revert examples

- Date: 2026-01-03 05:17 PM PT
- Author/Agent: Codex
- Scope: lib, examples
- Type: fix
- Summary:
  - Removed the `in` alias/wrapper to avoid reserved-word issues and rely solely on `inOp`.
  - Updated the inner-query example back to `inOp`.

- Impact:
  Restores clean builds/tests; examples remain current.

- Follow-ups:
  None.
