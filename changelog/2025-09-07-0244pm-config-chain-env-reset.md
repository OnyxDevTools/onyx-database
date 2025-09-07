# Change: reset ONYX env vars after config chain tests

- Date: 2025-09-07 02:44 PM PT
- Author/Agent: ChatGPT
- Scope: test
- Type: fix
- Summary:
  - clear ONYX_* environment variables after each config-chain test to ensure isolation.
- Impact:
  - prevents host credentials from interfering with tests.
- Follow-ups:
  - none
