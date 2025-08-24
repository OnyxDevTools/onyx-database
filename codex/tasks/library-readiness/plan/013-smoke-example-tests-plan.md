# Task: Smoke test examples/

## Goal
Keep examples from drifting.

## Steps
1. Add a CI job step to build the lib, then run `npx tsx examples/basic-usage.ts`.
2. If examples grow, add a simple `pnpm -r run start` in `examples/` or script loop.

## Plan
1. In the CI workflow, add a step after the build to run `npx tsx examples/basic-usage.ts`.
2. Ensure the library is built and linked so the example can import it.
3. If additional examples are added, create a script or `pnpm -r run start` in `examples/` to execute them all.
4. Verify the CI step fails if example compilation or runtime throws.

## Acceptance Criteria
- [ ] CI fails if examples stop compiling or throw at runtime.
