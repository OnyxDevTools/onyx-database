# Change: isolate home dir in config chain tests

- Date: 2025-09-07 02:23 PM PT
- Author/Agent: OpenAI ChatGPT
- Scope: test
- Type: fix
- Summary:
  - mock Node's home directory to avoid reading user profiles in config-chain tests
  - ensure tests run reliably regardless of developer environment
- Impact:
  - improves test isolation; no change to runtime code
- Follow-ups:
  - none
