# Change: ensure delete returns entity graph

- Date: 2025-08-24 12:05 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Send `Prefer: return=representation` header on DELETE requests so the API returns deleted records.
  - Update HTTP client tests for new header.
- Impact:
  - Delete operations now resolve with the removed entity and requested relationships.
- Follow-ups:
  - none
