# Default TypeScript entity transport to MessagePack

## Original task

Update the TypeScript/npm client library to use MessagePack by default and apply a trivial version bump for deployment.

## Plan

1. Change Node, edge, direct HTTP, and facade-cache defaults to MessagePack.
2. Retain and test explicit JSON compatibility behavior.
3. Update public documentation and release metadata.
4. Run focused tests plus lint, typecheck, build, and the full unit suite.

## Acceptance criteria

- [x] Entity CRUD, queries, and streams use MessagePack when `wireFormat` is omitted.
- [x] Explicit `wireFormat: 'json'` continues to use JSON.
- [x] Documents, schemas, secrets, AI, and model-builder requests remain JSON.
- [x] Node and edge defaults are covered by tests.
- [x] Package and generated version metadata report 2.8.2.
