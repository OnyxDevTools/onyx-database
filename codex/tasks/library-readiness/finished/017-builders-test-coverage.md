# Task: Ensure 100% test coverage for builders

## Goal
Cover all builder implementations under `src/builders` with exhaustive unit tests.

## Steps
1. Add tests for `CascadeBuilder` covering save and delete with and without `cascade` relationships.
2. Add tests for `SaveBuilder` handling `one` and `many` saves and relationship options.
3. Add tests for `ConditionBuilderImpl` including `and`, `or`, compound logic, `toCondition` error, and invalid input.
4. Add tests for `QueryBuilder` to exercise query construction, AND/OR combinations, list/page/update/delete/count/stream flows, and misuse errors.
5. Run `npm run typecheck`, `npm run build`, and `npm test -- --coverage`.

## Acceptance Criteria
- [x] Tests achieve 100% coverage for files in `src/builders`.
- [x] `npm run typecheck` passes.
- [x] `npm run build` passes.
- [x] `npm test -- --coverage` passes.
