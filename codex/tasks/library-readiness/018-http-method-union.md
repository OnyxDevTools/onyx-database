# Task 018: Strict HTTP method typing

## Task
Constrain `HttpClient.request`'s `method` parameter to a union of standard HTTP verbs to improve API design and clarity.

## Acceptance Criteria
- [ ] `HttpClient.request` accepts only `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'`
- [ ] Call sites compile with the stricter type
- [ ] Tests cover invalid method usage

