# Change: add query terminal formatters

- Date: 2026-05-21 01:48 PM PDT
- Author/Agent: Codex
- Scope: lib, examples, docs
- Type: feat
- Summary:
  - Added `.table()`, `.tree()`, `.csv()`, and `.json()` terminal formatter methods to the query builder with additive public option types.
  - Implemented shared zero-dependency formatting helpers for nested objects, CSV escaping, tree rendering, and JSON serialization.
  - Added query formatter examples, updated the example runner, and documented the new terminal methods in the README.

- Impact:
  - Public API is additive only; existing query and `.list()` behavior remains unchanged.
  - Query formatter methods now fetch and format complete result sets into printable strings.

- Follow-ups:
  - None.
