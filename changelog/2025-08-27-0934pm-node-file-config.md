# Change: restore file-based config resolution

- Date: 2025-08-27 09:34 PM PT
- Author/Agent: codex
- Scope: lib
- Type: fix
- Summary:
  - reintroduced project and home JSON config files when running on Node.js
  - skip file system lookups in non-Node environments
  - updated docs and tests for file-based config
- Impact:
  - Node users can load credentials from local files; no change for edge runtimes
- Follow-ups:
  - none

