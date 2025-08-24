# Task: Add Codecov report and full coverage for core files

## Goal
Generate an lcov report and reach 100% test coverage for `src/core/http.ts` and `src/errors/config-error.ts`.

## Steps
1. Add `lcov` reporter in `vitest.config.ts` for Codecov uploads.
2. Expand tests for `parseJsonAllowNaN` and `HttpClient` to cover constructor branches and error fallback.
3. Add unit tests for `OnyxConfigError`.
4. Run `npm run typecheck`, `npm run build`, and `npm test`.

# Plan: Add Codecov report and full coverage for core files
1. Update `vitest.config.ts` with `lcov` reporter.
2. Write additional specs in `tests/http-client.spec.ts` for all HttpClient and JSON parsing branches.
3. Create `tests/config-error.spec.ts` to exercise `OnyxConfigError`.
4. Verify coverage reaches 100% for `src/core/http.ts` and `src/errors/config-error.ts`.
5. Execute `npm run typecheck`, `npm run build`, and `npm test`.

## Acceptance Criteria
- [x] `src/core/http.ts` reports 100% coverage.
- [x] `src/errors/config-error.ts` reports 100% coverage.
- [x] Coverage run generates `lcov` output for Codecov.
