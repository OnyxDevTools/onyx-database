# Change: allow resolve to accept string inputs consistently

- Date: 2025-11-24 04:32 AM UTC
- Author/Agent: GPT-5.1-Codex-Max
- Scope: lib
- Type: fix
- Summary:
  - Normalize select and resolve inputs to handle strings and string arrays uniformly.
  - Ensure resolver names provided as single strings remain attached when executing queries.
  - Add coverage proving single-string resolver inputs are forwarded to query execution.

- Impact:
  - Enables `.resolve('roles')` calls to include resolver names without requiring array wrapping.

- Follow-ups:
  - None.
