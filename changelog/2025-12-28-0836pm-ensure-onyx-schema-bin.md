# Change: ensure onyx-schema shim installed in examples bootstrap

- Date: 2025-12-28 08:36 PM PT
- Author/Agent: Codex
- Scope: tooling
- Type: fix
- Summary:
  - rerun examples install when either onyx-gen or onyx-schema shim is missing
  - keep bootstrap aligned with the new schema CLI bin
- Impact:
  - no public API changes; ensures CLI binaries available after bootstrap
- Follow-ups:
  - none
