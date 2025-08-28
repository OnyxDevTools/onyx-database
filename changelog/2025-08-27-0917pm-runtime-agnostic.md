# Change: remove Node runtime assumptions

- Date: 2025-08-27 09:17 PM PT
- Author/Agent: openai-assistant
- Scope: lib
- Type: refactor
- Summary:
  - Dropped project/home file resolution and `process` imports to enable non-Node runtimes.
  - Config now resolves from env (when available) or explicit input only.
  - Build targets neutral platform; docs and tests updated.
- Impact:
  - Library can run in Cloudflare Workers and other environments without Node APIs.
- Follow-ups:
  - None
