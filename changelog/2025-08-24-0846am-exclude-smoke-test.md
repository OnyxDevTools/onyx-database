# Change: exclude smoke test from default run

- Date: 2025-08-24 08:46 AM PT
- Author/Agent: ChatGPT
- Scope: test
- Type: test
- Summary:
  - Excluded `tests/smoke.spec.ts` from default Vitest runs so `npm test` skips the smoke test.
  - Smoke tests still runnable via `npm run test:smoke`.
- Impact:
  - Test suite no longer fails due to missing Onyx config when running `npm test`.
- Follow-ups:
  - none
