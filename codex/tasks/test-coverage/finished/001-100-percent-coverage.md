# Task: Achieve 100% test coverage

## Goal
Reach full statement, branch, and function coverage across the project.

## Steps
1. Run coverage reports to locate gaps.
2. Write tests for uncovered code paths.
3. Set coverage thresholds to `100` in `vitest.config.ts`.
4. Add coverage enforcement to CI workflow.

## Acceptance Criteria
- Coverage reports show 100% for statements, branches, functions, and lines.
- CI fails if coverage falls below 100%.
- README or docs note the 100% coverage guarantee.

## Plan
1. Execute `npm test -- --coverage` to generate baseline coverage and list uncovered lines.
2. Create unit tests for any remaining uncovered code paths in `src/`.
3. Configure `vitest.config.ts` with `100` thresholds for statements, branches, functions, and lines.
4. Update `.github/workflows/ci.yml` to run tests with coverage so thresholds enforce in CI.
5. Document the 100% coverage guarantee in `README.md`.

## Acceptance Criteria
- [x] Coverage reports show 100% for statements, branches, functions, and lines.
- [x] CI fails if coverage falls below 100%.
- [x] README or docs note the 100% coverage guarantee.
