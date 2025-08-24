# Change: restrict HttpClient.request method to standard verbs

- Date: 2025-08-24 09:08 PM UTC
- Author/Agent: ChatGPT
- Scope: lib
- Type: feat
- Summary:
  - limit HttpClient.request to 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  - add compile-time test for invalid HTTP methods
- Impact:
  - strengthens type safety for HTTP requests
- Follow-ups:
  - n/a
