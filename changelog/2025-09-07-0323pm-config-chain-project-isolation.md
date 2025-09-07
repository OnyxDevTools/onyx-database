# Change: isolate config-chain tests from project files

- Date: 2025-09-07 03:23 PM PT
- Author/Agent: ChatGPT
- Scope: test
- Type: fix
- Summary:
  - change config-chain tests to run in temp directories without project config
  - prevents local project files from affecting test expectations
- Impact:
  - more reliable tests; no runtime changes
- Follow-ups:
  - none
