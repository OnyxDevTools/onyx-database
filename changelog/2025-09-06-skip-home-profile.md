# Change: skip home profile when explicit config provided

- Date: 2025-09-06 02:05 AM UTC
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Avoid reading project or home profile when explicit config/env already supply required credentials.
  - Remove unused example import to satisfy lint.
- Impact:
  - Prevents unexpected OnyxConfigError from malformed home profiles during init.
- Follow-ups:
  - None
