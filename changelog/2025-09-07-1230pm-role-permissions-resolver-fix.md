# Change: fix role permissions resolver syntax

- Date: 2025-09-07 12:30 PM PT
- Author/Agent: ChatGPT
- Scope: examples
- Type: fix
- Summary:
  - Correct Role `permissions` resolver to query `Permission` through `RolePermission` join IDs via `inOp`.
  - Ensure `rolePermissions` and `permissions` resolvers align in order and usage.
- Impact:
  - Documentation schema accuracy; no runtime impact.
- Follow-ups:
  - none
