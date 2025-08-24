# Task: Smoke test examples/

## Goal
Keep examples from drifting.

## Steps
1. Add a CI job step to build the lib, then run `npx tsx examples/basic-usage.ts`.
2. If examples grow, add a simple `pnpm -r run start` in `examples/` or script loop.

## Acceptance Criteria
- CI fails if examples stop compiling or throw at runtime.
