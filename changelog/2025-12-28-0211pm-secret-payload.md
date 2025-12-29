# Change: Remove secret rename payload support

- Date: 2025-12-28 02:11 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Disallowed specifying `key` in `putSecret` requests to match API capabilities.
  - Updated public interface docs and README example to reflect the supported secret update shape.
- Impact:
  - Type-safe clients no longer accept a `key` field in secret save payloads.
- Follow-ups:
  - None.
