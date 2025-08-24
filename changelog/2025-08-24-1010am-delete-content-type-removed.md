# Change: omit Content-Type on empty DELETE requests

- Date: 2025-08-24 10:10 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Remove 'Content-Type: application/json' header from DELETE requests without bodies so the service returns the deleted entity.
  - Update HTTP client tests to expect the missing header.
- Impact:
  - Cascading deletes now return the deleted record in the response body.
- Follow-ups:
  - none
