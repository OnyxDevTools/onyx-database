# Change: remove save partition option

- Date: 2025-09-05 02:50 PM PT
- Author/Agent: openai
- Scope: lib | docs | tests
- Type: fix
- Summary:
  - Remove partition parameters from save APIs and builders
  - Document that saves rely on the entity's partition field
  - Drop partition-specific tests and examples for save operations

- Impact:
  - Save operations no longer accept a partition option

- Follow-ups:
  - None

