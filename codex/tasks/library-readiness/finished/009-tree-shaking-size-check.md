# Task: Tree-shaking & size checks

## Goal
Ensure minimal bundle footprint.

## Steps
1. Add `size-limit` tooling: `npm i -D size-limit @size-limit/file`
2. Create `.size-limit.json` with budget (e.g., 10KB gzip for core).
3. Script: `"size": "size-limit"` and run in CI.

## Plan
1. Install `size-limit` and `@size-limit/file` as dev dependencies.
2. Create `.size-limit.json` with a 10KB gzip budget targeting the built entry (`dist/index.js`).
3. Add an npm script `"size": "size-limit"` to `package.json`.
4. Build the library and run `npm run size` to confirm the bundle stays within budget.
5. Update `.github/workflows/ci.yml` to execute `npm run size` so CI fails when the limit is exceeded.

## Acceptance Criteria
- [x] `npm run size` passes under the configured budget.
- [x] CI fails if budget exceeded.
