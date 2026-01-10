# Change: Add runtime guards to examples

- Date: 2026-01-08 04:18 PM PST
- Author/Agent: Codex
- Scope: examples
- Type: fix
- Summary:
  - added simple runtime checks to selected examples (delete by id/query, basic query patterns, aggregates, save basic) to throw clear errors when expected results are missing or mismatched
  - improved delete-by-id to validate the returned record id instead of assuming a count

- Impact:
  Examples only; aids regression runs by failing fast with human-friendly messages.

- Follow-ups:
  Extend similar guards to remaining examples as needed.
