# Task: Type-level tests

## Goal
Prevent type regressions.

## Steps
1. Install `tsd`: `npm i -D tsd`
2. Add `tsd.config.json` and `test-d/` with `.test-d.ts` assertions using `expectType`, `expectError`.
3. Script: `"types:test": "tsd"`

## Plan
1. Install `tsd` as a dev dependency.
2. Create `tsd.config.json` referencing the project's TypeScript config.
3. Add a `test-d/` directory with `*.test-d.ts` files using `expectType` and `expectError` to cover public APIs.
4. Add an npm script `"types:test": "tsd"` to `package.json`.
5. Run `npm run types:test` to verify the assertions.

## Acceptance Criteria
- [ ] `npm run types:test` passes.
- [ ] A deliberate type break causes test failure.
