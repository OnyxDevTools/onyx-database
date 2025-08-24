# Task: Add HttpClient tests with mocks

## Goal
Increase coverage for HttpClient and JSON parsing using mocked fetch implementations.

## Steps
1. Write tests for `parseJsonAllowNaN` to ensure it handles `NaN` and `Infinity` values.
2. Mock `fetch` to test `HttpClient.request` success path and verify headers.
3. Mock `fetch` to test error responses and `OnyxHttpError` handling.

# Plan: Add HttpClient tests with mocks
1. Create `tests/http-client.spec.ts` covering `parseJsonAllowNaN` and `HttpClient.request` using `vi.fn` mocks.
2. Simulate both successful and error HTTP responses.
3. Run `npm run typecheck`, `npm run build`, and `npm test`.

## Acceptance Criteria
- [x] Tests cover success and error paths of `HttpClient`.
- [x] `npm test` passes with the new coverage.
