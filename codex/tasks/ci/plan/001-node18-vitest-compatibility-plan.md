# Task 001: Restore Node 18 test compatibility

## Original Task
Fix the CI startup error from `npm test -- --coverage` where Rolldown imports
`styleText` from `node:util` on Node 18.

## Plan
1. Confirm the CI Node matrix and the installed test-tool runtime requirements.
2. Align Vitest and both coverage providers on a Node 18-compatible release line.
3. Constrain Vite to a Node 18-compatible major release.
4. Refresh the lockfile and verify install, tests with coverage, lint, typecheck, and build.
5. Record the tooling change and archive this task when all checks pass.

## Acceptance Criteria
- [ ] `npm ci` installs a test toolchain whose declared engines include Node 18.
- [ ] `npm test -- --coverage` starts and passes without the `node:util` `styleText` error.
- [ ] Vitest and its coverage providers use matching versions.
- [ ] Lint, typecheck, and build pass.
- [ ] A changelog entry documents the fix.
