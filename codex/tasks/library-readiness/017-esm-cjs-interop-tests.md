# Task: Interop tests (ESM & CJS)

## Goal
Guarantee consumers can import from both module systems.

## Steps
1. Add `tests/interop.cjs.test.cjs` that `require()`s the CJS build.
2. Add `tests/interop.esm.test.mjs` that dynamic `import()`s ESM build.
3. Ensure named exports resolution identical in both.

## Acceptance Criteria
- Both tests pass in CI.
- Export shape is consistent across ESM/CJS.
