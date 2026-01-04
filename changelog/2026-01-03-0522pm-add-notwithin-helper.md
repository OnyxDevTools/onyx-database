# Change: add `notWithin` helper alias for notIn

- Date: 2026-01-03 05:22 PM PT
- Author/Agent: Codex
- Scope: lib, examples
- Type: fix
- Summary:
  - Introduced `notWithin` as a wrapper for `notIn` to mirror `within`, keeping inner-query support with a reserved-word-safe name.
  - Added test coverage and updated the not-in inner-query example to use the new helper.

- Impact:
  Developer ergonomics; runtime unchanged.

- Follow-ups:
  None.
