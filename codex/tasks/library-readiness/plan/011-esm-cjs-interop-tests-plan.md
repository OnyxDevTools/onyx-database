# Task: Interop tests (ESM & CJS)

## Goal
Guarantee consumers can import from both module systems.

## Steps
1. Add `tests/interop.cjs.test.cjs` that `require()`s the CJS build.
2. Add `tests/interop.esm.test.mjs` that dynamic `import()`s ESM build.
3. Ensure named exports resolution identical in both.

## Plan
1. Create `tests/interop.cjs.test.cjs` using `require('../dist/index.cjs')`.
2. Create `tests/interop.esm.test.mjs` with dynamic `import('../dist/index.js')`.
3. Compare `Object.keys` from each module to verify identical named exports.
4. Run `npm test` to execute both files under Vitest.

## Acceptance Criteria
- [ ] `tests/interop.cjs.test.cjs` requires the CJS build without errors.
- [ ] `tests/interop.esm.test.mjs` dynamically imports the ESM build without errors.
- [ ] Named export sets match between ESM and CJS builds.
