# Change: tighten env matching in config resolver

- Date: 2025-09-07 08:48 AM PT
- Author/Agent: ChatGPT
- Scope: lib | test
- Type: fix
- Summary:
  - Ignore environment credentials unless ONYX_DATABASE_ID matches the target.
  - Clean tests of stray ONYX_* variables.
- Impact:
  - Prevents unexpected credential leaks from unrelated env vars.
- Follow-ups:
  - None
