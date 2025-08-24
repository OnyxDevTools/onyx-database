# Change: prevent overriding auth headers

- Date: 2025-08-24 11:51 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Ignore `x-onyx-key` and `x-onyx-secret` from caller-provided headers.
  - Test coverage for protected auth headers.
- Impact:
  - Prevents accidental credential overrides.
- Follow-ups:
  - Task 018: Strict HTTP method typing
  - Task 019: Validate request URLs

