# Change: Fix seed data for schemas without ID generators

- Date: 2026-01-07 08:21 PM PST
- Author/Agent: Codex
- Scope: examples
- Type: fix
- Summary:
  - generate explicit UUIDs in `examples/seed.ts` so saves succeed when schema identifiers require caller-provided IDs
  - prevents 422 errors during example seeding when generators are set to `None`

- Impact:
  Examples only; no library or CLI changes.

- Follow-ups:
  None.
