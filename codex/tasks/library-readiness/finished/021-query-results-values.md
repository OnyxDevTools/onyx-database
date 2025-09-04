# 021 QueryResults values helper

## Task
Add a `values(field)` method to `QueryResults` that returns an array of the specified field across all pages.

## Plan
1. Implement `values` in `src/builders/query-results.ts` to gather all pages and pluck the field.
2. Add unit test verifying `values` collects IDs across multiple pages.
3. Document the helper in the README.
4. Record a changelog entry.

## Acceptance Criteria
- [x] `QueryResults.values` fetches every page and returns field values.
- [x] Test coverage ensures the method works.
- [x] README shows usage of `values`.
- [x] Changelog entry added.

