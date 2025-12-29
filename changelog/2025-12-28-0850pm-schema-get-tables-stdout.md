# Change: avoid overwriting schema files when fetching tables subset

- Date: 2025-12-28 08:50 PM PT
- Author/Agent: Codex
- Scope: cli
- Type: fix
- Summary:
  - `onyx-schema get` now pretty-prints to stdout when `--tables` is provided instead of writing a partial schema file
  - README documents the stdout behavior, adds example commands, and shows sample subset output
- Impact:
  - prevents partial table fetches from overwriting local schema files; no public API changes
- Follow-ups:
  - none
