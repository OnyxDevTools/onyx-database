# Change: return body for DELETE responses

- Date: 2025-08-24 08:20 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Avoid sending `Content-Type` when no request body is present so DELETE responses can include JSON payloads.
  - Update tests to reflect header omission.
- Impact:
  - DELETE operations now return server-provided entities instead of empty strings.
- Follow-ups:
  - none
