# Change: validate request URLs

- Date: 2025-08-24 02:07 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - validate HttpClient baseUrl and request path inputs
  - throw OnyxConfigError for malformed URLs
  - add tests for invalid baseUrl and path
- Impact:
  - prevents malformed HTTP requests
- Follow-ups:
  - none
