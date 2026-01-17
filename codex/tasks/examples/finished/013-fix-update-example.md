# Task: Fix query/update example

## Goal
Ensure the `examples/query/update.ts` script updates a real record so the example suite passes.

## Plan
1. Reproduce the failure via `scripts/run-examples.sh` to confirm the `query/update` step.
2. Update `examples/query/update.ts` to create/seed the target user before issuing the update and assert the update result.
3. Rerun the examples script to verify `query/update` and the full suite succeed.

## Acceptance Criteria
- [x] The update example seeds or creates a target record before issuing the update.
- [x] The script verifies a successful update without throwing in normal runs.
- [x] `scripts/run-examples.sh` passes the `query/update` step.

## Notes
- The example now upserts `example-user-1` before updating, adds an `updatedAt` stamp, and asserts the record is inactive afterward.
- `./scripts/run-examples.sh` now passes all examples, including `query/update`.
