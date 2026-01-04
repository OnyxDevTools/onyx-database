# Change: Adjust schema diff formatting

- Date: 2026-01-03 04:06 PM PT
- Author/Agent: Codex
- Scope: cli
- Type: fix
- Summary:
  - remove list dashes before table names in `onyx-schema diff` output for a cleaner YAML-style view
  - keep nested sections (indexes, etc.) using list markers while table headings are plain
  - aligned tests to the new formatting

- Impact:
  CLI diff output formatting only; no API changes.

- Follow-ups:
  None.
