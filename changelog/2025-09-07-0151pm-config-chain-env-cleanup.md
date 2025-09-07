# Change: isolate config chain tests from host env

- Date: 2025-09-07 01:51 PM PT
- Author/Agent: ChatGPT
- Scope: test
- Type: fix
- Summary:
  - clear ONYX_CONFIG_PATH in config-chain tests to prevent interference from host environment variables.
- Impact:
  - avoids false positives or failures when ONYX_CONFIG_PATH is set.
- Follow-ups:
  - none
