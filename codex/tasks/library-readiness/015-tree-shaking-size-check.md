# Task: Tree-shaking & size checks

## Goal
Ensure minimal bundle footprint.

## Steps
1. Add `size-limit` tooling: `npm i -D size-limit @size-limit/preset-small-lib`
2. Create `.size-limit.json` with budget (e.g., 10KB gzip for core).
3. Script: `"size": "size-limit"` and run in CI.

## Acceptance Criteria
- `npm run size` passes under the configured budget.
- CI fails if budget exceeded.
