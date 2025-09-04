# Task: Restrict retries to queries and gets

## Task
Remove retry logic for create, update, save, and delete requests. Implement exponential backoff retries for query and get requests only.

## Plan
1. Update `src/core/http.ts` to only retry when the request is a `GET` or a read query (`/query/` not including update/delete) and to use exponential backoff (`base * 2^attempt`).
2. Adjust `tests/http-client.spec.ts` to cover new retry policy: ensure `GET` and read query requests retry with exponential backoff, and non-idempotent methods do not retry.
3. Add a changelog entry documenting the retry policy change.

## Acceptance Criteria
- [x] GET and read query requests retry with exponential backoff.
- [x] Create, update, save, and delete requests do not retry.
- [x] Tests cover both retry and non-retry behavior.
