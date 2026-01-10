# Task: Add schema SDK examples

Add runnable scripts in `examples/` that demonstrate schema management using the SDK.

## Goal
Provide focused examples for fetching, validating, publishing, and inspecting schema revisions using `onyx.init()`.

## Plan
1. Create a new `examples/schema/` folder with scripts for fetching the schema (full and filtered) and writing it to disk.
2. Add a validation example that reads `examples/onyx.schema.json`, calls `validateSchema`, and reports results clearly.
3. Add a publish example that validates first, then publishes the schema with a revision description using `updateSchema`.
4. Add a history example that retrieves recent revisions with `getSchemaHistory`.
5. Update `examples/tsconfig.json` includes and add a changelog entry.

## Acceptance Criteria
- [x] Example fetching the current schema with optional table filters.
- [x] Example validating a local schema file.
- [x] Example publishing a schema update with `publish: true`.
- [x] Example listing schema revision history.
- [x] Changelog entry added.
