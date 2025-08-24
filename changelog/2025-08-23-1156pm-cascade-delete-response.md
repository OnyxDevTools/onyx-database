# Change: fix cascade delete returns entity

- Date: 2025-08-23 11:56 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Add `Accept: application/json` header so delete responses include body.
  - Update delete methods to return the removed record.
- Impact:
  - `delete()` now resolves with the deleted entity and requested relationships.
- Follow-ups:
  - none
