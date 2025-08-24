# Task 019: Validate request URLs

## Task
Improve stability by validating `baseUrl` and request `path` in `HttpClient` to prevent malformed requests.

## Plan
1. Import `OnyxConfigError` in `src/core/http.ts`.
2. In `HttpClient` constructor, throw when `baseUrl` is empty or cannot be parsed as a URL with protocol.
3. In `request`, reject `path` values that do not start with `/`.
4. Add unit tests covering invalid `baseUrl` and `path` scenarios.
5. Ensure typecheck, build, and test commands pass.

## Acceptance Criteria
- [x] `HttpClient` constructor throws if `baseUrl` is empty or lacks a protocol
- [x] `request` rejects paths that do not start with "/"
- [x] Tests verify invalid inputs are handled
