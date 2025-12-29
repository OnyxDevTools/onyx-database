# Change: Fix secrets endpoint path

- Date: 2025-12-28 02:47 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - Pointed secrets list/read/write/delete calls to `/database/{databaseId}/secret...` to match the API (list is singular `/secret`).
  - Added explicit JSON Content-Type headers for secrets GET calls to match the service expectations.
  - Normalized `deleteSecret` to return the requested key even when the API responds with an empty body.
  - Updated path expectation tests accordingly.
- Impact:
  - Secrets API calls no longer 404; behavior matches live service.
- Follow-ups:
  - None
