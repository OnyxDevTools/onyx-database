# Composable bounded index candidates

## Original task

Allow the native `CANDIDATES` operator to follow the same fluent composition pattern as ordinary query operators while retaining its physical posting-visit bound.

## Plan

1. Permit exactly one `CANDIDATES` clause in a non-negated `AND` tree.
2. Keep `SEARCH_CANDIDATES` and `HNSW_CANDIDATES` sole-root and reject `OR` composition.
3. Make `where(approximateCandidates(...)).and(...)` the canonical TypeScript
   syntax and retain the builder method only for compatibility.
4. Update both TypeScript builder implementations, documentation, and regression tests.
5. Verify tests, lint, typecheck, and build.

## Acceptance criteria

- [x] `.where(approximateCandidates(...)).and(...)` works in either call order.
- [x] The builder-level shortcut is documented as deprecated compatibility API.
- [x] Nested pure-`AND` condition builders containing `CANDIDATES` are accepted.
- [x] `OR` and duplicate `CANDIDATES` clauses fail before transport.
- [x] Full TypeScript test, lint, typecheck, and build checks pass.
