# Task: Testing with Vitest + ts-node support

## Goal
Unit tests with Vitest and coverage.

## Steps
1. Install: `npm i -D vitest @vitest/coverage-v8 ts-node`
2. Create `vitest.config.ts` with TypeScript support, include `src` in coverage.
3. Add `tests/basic.spec.ts` with a simple test for the exported function.
4. Add scripts:
   - `"test": "vitest run"`
   - `"test:watch": "vitest"`

## Acceptance Criteria
- `npm test` passes and writes coverage summary.
- Coverage includes lines, functions, branches for `src/`.
