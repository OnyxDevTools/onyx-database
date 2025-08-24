# Change: parse JSON delete body without content-type

- Date: 2025-08-24 09:05 AM PT
- Author/Agent: OpenAI ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Parse delete responses as JSON when body looks like JSON but lacks content-type
  - Ensures cascade delete returns entity graph
- Impact:
  - More reliable delete responses with missing content-type
- Follow-ups:
  - none
