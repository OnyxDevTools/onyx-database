# Plan: Testing with Vitest + ts-node support

1. Install `vitest`, `@vitest/coverage-v8`, and `ts-node` as dev dependencies.
2. Create `vitest.config.ts` with TypeScript support via ts-node and include `src` for coverage.
3. Add `tests/basic.spec.ts` with a simple assertion against an exported function.
4. Update `package.json` scripts with `"test": "vitest run"` and `"test:watch": "vitest"`.
5. Run `npm test` to verify execution and coverage output.

## Acceptance Criteria
- [ ] `npm test` passes and writes coverage summary.
- [ ] Coverage includes lines, functions, and branches for `src/`.
