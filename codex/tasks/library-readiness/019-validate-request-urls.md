# Task 019: Validate request URLs

## Task
Improve stability by validating `baseUrl` and request `path` in `HttpClient` to prevent malformed requests.

## Acceptance Criteria
- [ ] `HttpClient` constructor throws if `baseUrl` is empty or lacks a protocol
- [ ] `request` rejects paths that do not start with `/`
- [ ] Tests verify invalid inputs are handled

