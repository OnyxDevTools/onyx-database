# Task: Split streaming example into focused demos

Create separate examples for query streaming and individual event types.

## Plan
1. Remove `examples/stream/basic.ts`.
2. Add `examples/stream/query-stream.ts` showing how query results stream in chunks.
3. Add `examples/stream/create-events.ts` handling `CREATE` actions.
4. Add `examples/stream/update-events.ts` handling `UPDATE` actions.
5. Add `examples/stream/delete-events.ts` handling `DELETE` actions.
6. Document parameters and use cases with inline comments.
7. Add a changelog entry.

## Acceptance Criteria
- [x] Basic streaming example removed.
- [x] `query-stream.ts` demonstrates chunked query streaming.
- [x] `create-events.ts` logs create events.
- [x] `update-events.ts` logs update events.
- [x] `delete-events.ts` logs delete events.
- [x] Changelog entry added.
