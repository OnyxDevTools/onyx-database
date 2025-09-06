# Change: enable debug request/response logging via ONYX_DEBUG

- Date: 2025-09-05 08:52 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Automatically logs HTTP requests and responses when `ONYX_DEBUG=true` even if logging flags are not set.
  - Documented `ONYX_DEBUG` behavior in README.
- Impact:
  - Behavior: debugging environment variable now forces HTTP logging.
- Follow-ups:
  - none

