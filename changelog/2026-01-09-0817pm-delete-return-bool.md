# Change: Make delete return success flag

- Date: 2026-01-09 08:17 PM PST
- Author/Agent: Codex
- Scope: lib | examples
- Type: fix
- Summary:
  - Change `db.delete(table, id)` to return `true` on success instead of the deleted entity.
  - Update cascade builder typings and runtime to match the boolean return.
  - Align the delete-by-id example with the new boolean result while still verifying the record is gone.

- Impact:
  - Public API: delete-by-id now resolves to `boolean`; consumers should not expect a returned entity body.

- Follow-ups:
  - None.
