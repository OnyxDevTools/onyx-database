# Change: update credential chain precedence

- Date: 2025-09-07 10:34 PM UTC
- Author/Agent: OpenAI ChatGPT
- Scope: lib | docs | test
- Type: fix
- Summary:
  - prioritize explicit config over env vars, config path, project, and home files
  - add tests and docs for new credential resolution order
- Impact:
  - behavior: env vars now override ONYX_CONFIG_PATH
- Follow-ups:
  - none

