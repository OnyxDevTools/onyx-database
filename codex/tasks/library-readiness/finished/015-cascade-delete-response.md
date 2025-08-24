# Task: Fix cascade delete response

## Goal
Ensure cascade delete returns deleted entity including requested relationships.

## Steps
1. Add `Accept: application/json` header to all HTTP requests.
2. Update IOnyxDatabase and CascadeBuilder delete methods to return typed entity.
3. Adjust README example to capture delete response.
4. Cover new header in tests.
5. Record changelog entry.

# Plan: Fix cascade delete response
1. Modify `src/core/http.ts` headers to include `Accept: application/json`.
2. Update `src/types/public.ts` and `src/impl/onyx.ts` to type `delete` return value.
3. Adjust `src/builders/cascade-builder.ts` to return typed `delete`.
4. Update `tests/http-client.spec.ts` expectations for `Accept` header and add DELETE case.
5. Revise README delete example to show returned record.
6. Add changelog entry under `changelog/`.
7. Run `npm run typecheck`, `npm test`, `npm run build`.

## Acceptance Criteria
- [x] HttpClient sends `Accept: application/json`.
- [x] `delete` methods return parsed JSON.
- [x] README reflects delete response.
- [x] Tests, typecheck, and build succeed.
