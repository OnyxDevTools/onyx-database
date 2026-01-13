# Change: add edge-safe entry point

- Date: 2026-01-13 09:07 AM PT
- Author/Agent: automation
- Scope: lib
- Type: feat
- Summary:
  - added an edge-only entry point with env-only config resolution and conditional exports
  - added tests for edge config and Next.js turbopack integration
  - documented edge runtime usage and limitations

- Impact:
  - provides an edge-compatible entry without Node-only imports; Node entry remains unchanged

- Follow-ups:
  - None
