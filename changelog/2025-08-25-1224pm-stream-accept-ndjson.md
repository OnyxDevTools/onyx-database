# Change: fix stream Accept header for ndjson

- Date: 2025-08-25 12:24 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - request streaming queries with `application/x-ndjson`
  - enables stream example to receive item events
- Impact:
  - streaming subscriptions now emit change events
- Follow-ups:
  - none
