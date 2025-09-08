# Change: hide Node builtins from bundlers

- Date: 2025-09-07 06:20 PM PT
- Author/Agent: openhands
- Scope: lib
- Type: fix
- Summary:
  - wrap Node-only config helpers in dynamic import to prevent bundlers from resolving built-in modules
- Impact:
  - enables bundling in Worker environments that only rely on environment variables
- Follow-ups:
  - none
