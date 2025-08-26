# Change: retry transient HTTP errors

- Date: 2025-08-26 04:55 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - add simple retry/backoff logic to HttpClient for 5xx responses
  - cover retry behavior with unit tests
- Impact:
  - improves resilience to temporary network issues such as Cloudflare 524 timeouts
- Follow-ups:
  - none
