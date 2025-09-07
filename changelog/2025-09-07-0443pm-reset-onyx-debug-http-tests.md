# Change: reset ONYX_DEBUG in HttpClient tests

- Date: 2025-09-07 04:43 PM PT
- Author/Agent: ChatGPT
- Scope: test
- Type: test
- Summary:
  - clear ONYX_DEBUG env var before each HttpClient test to prevent cross-test interference
- Impact:
  - ensures tests pass even when ONYX_DEBUG is set globally
- Follow-ups:
  - none
