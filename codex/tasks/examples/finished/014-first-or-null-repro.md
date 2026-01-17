# Task: Cover firstOrNull without where

## Goal
Add a learning example under `examples/query/` that demonstrates `firstOrNull()` without a `where()` clause using the repository schema (instead of the reported Player sample).

## Plan
1. Create a new example script under `examples/query/` that calls `.firstOrNull()` without a preceding `.where()` using `tables.User` and `desc(...)` ordering.
2. Seed a record so the call returns data and keep the script aligned with the example schema.
3. Run the script to validate behavior and wire it into `scripts/run-examples.sh` once supported.

## Acceptance Criteria
- [x] Example uses existing schema tables (e.g., `tables.User`) and no custom `Player`.
- [x] Running the script returns data without requiring `where()`.
- [x] Example is added to the automated `scripts/run-examples.sh` suite.

## Notes
- Added `examples/query/first-or-null-all-data.ts` that seeds `first-or-null-user-1`, orders by `createdAt`, and calls `.firstOrNull()` without `.where()`.
- `scripts/run-examples.sh` includes the example to prevent regressions. 
