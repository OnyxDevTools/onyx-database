# Task 018: Strict HTTP method typing

## Task
Constrain `HttpClient.request`'s `method` parameter to a union of standard HTTP verbs to improve API design and clarity.

## Plan
1. Define the allowed HTTP verb union `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'`.
2. Update `HttpClient.request` signature to use this union for the `method` parameter.
3. Ensure all call sites still type-check; adjust if necessary.
4. Add a test using `@ts-expect-error` to assert an invalid method fails compilation.
5. Run `npm run typecheck`, `npm run build`, and `npm test` to verify integrity.

## Acceptance Criteria
- [x] `HttpClient.request` accepts only `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'`
- [x] Call sites compile with the stricter type
- [x] Tests cover invalid method usage
