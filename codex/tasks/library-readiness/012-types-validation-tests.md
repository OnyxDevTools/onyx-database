# Task: Type-level tests

## Goal
Prevent type regressions.

## Steps
1. Install `tsd`: `npm i -D tsd`
2. Add `tsd.config.json` and `test-d/` with `.test-d.ts` assertions using `expectType`, `expectError`.
3. Script: `"types:test": "tsd"`

## Acceptance Criteria
- `npm run types:test` passes.
- A deliberate type break causes test failure.
