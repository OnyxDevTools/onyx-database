# Change: Add schema diff API and YAML CLI output

- Date: 2026-01-06 09:42 AM PST
- Author/Agent: Codex
- Scope: lib, cli
- Type: feat
- Summary:
  - add `diffSchema` to the SDK to compare a local schema with the current API schema
  - share diff computation logic across the SDK and `onyx-schema diff`
  - emit YAML-formatted diff output from the CLI

- Impact:
  Public API extended with `diffSchema`; CLI diff output format changed to YAML.

- Follow-ups:
  None.
