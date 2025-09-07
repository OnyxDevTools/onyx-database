# Change: isolate config-chain tests from host env

- Date: 2025-09-07 02:51 PM PT
- Author/Agent: ChatGPT
- Scope: test
- Type: fix
- Summary:
  - clear ONYX environment variables before each config-chain test to avoid flakiness
- Impact:
  - ensures tests pass when host defines ONYX env vars
- Follow-ups:
  - none
