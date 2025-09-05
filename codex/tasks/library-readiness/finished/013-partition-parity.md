# Task: partition support parity for TypeScript client

The TypeScript client should match the Kotlin client's partition capabilities.

## Original Task
- allow specifying a partition when saving entities
- ensure reads and writes (gets, queries, updates, deletes) accept a partition option
- allow `onyx.init({ partition: 'x' })` to set a default partition

## Plan
1. Extend `OnyxConfig` with optional `partition` and store default partition in `OnyxDatabaseImpl`.
2. Support explicit partition options on save operations (no default applied).
3. Default query builders, `findById`, and delete-by-id to the configured partition when none supplied.
4. Update interfaces, docs, README, and changelog.
5. Add tests for save partitions and default partition initialization.

## Acceptance Criteria
- [x] Saving supports a `partition` option.
- [x] Providing `partition` to `init` sets the default for queries, `findById`, and delete by primary key.
- [x] Tests cover saving with partition and default partition behavior.
- [x] Documentation and changelog updated.
