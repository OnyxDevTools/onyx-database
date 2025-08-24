# Change: preserve Content-Type on DELETE requests

- Date: 2025-08-24 12:37 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Retain 'Content-Type: application/json' header on DELETE requests so the API returns the deleted graph.
  - Update HTTP client tests to reflect header presence.
- Impact:
  - Ensures cascade deletes return the deleted entity graph instead of an empty body.
- Follow-ups:
  - None
