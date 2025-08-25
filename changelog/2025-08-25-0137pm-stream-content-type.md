# Change: set content type for streaming queries

- Date: 2025-08-25 01:37 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - explicitly send `Content-Type: application/json` when opening streaming queries
  - rely on HttpClient to include authentication headers
- Impact:
  - ensures streaming requests are properly authenticated and parsed
- Follow-ups:
  - none
