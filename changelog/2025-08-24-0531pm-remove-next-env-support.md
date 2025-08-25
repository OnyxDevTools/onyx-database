# Change: remove NEXT_* env var support

- Date: 2025-08-24 05:31 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: refactor
- Summary:
  - drop support for NEXT_* environment variables in config chain
  - ensure credentials are sourced only from server-side env vars
- Impact:
  - NEXT_* env vars are no longer recognized
- Follow-ups:
  - none
