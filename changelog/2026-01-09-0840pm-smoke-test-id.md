# Change: Fix smoke test user role ids

- Date: 2026-01-09 08:40 PM PST
- Author/Agent: Codex
- Scope: tests
- Type: fix
- Summary:
  - Added explicit `id` to the cascaded `UserRole` data in `tests/smoke.spec.ts` to satisfy the schema’s identifier requirement during e2e runs.

- Impact:
  - Test-only; ensures CI smoke test creates valid user role records.

- Follow-ups:
  - None.
