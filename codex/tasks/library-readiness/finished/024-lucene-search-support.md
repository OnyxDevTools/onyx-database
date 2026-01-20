# Task: Lucene search support in TypeScript SDK

## Context
- Add full-text search parity with the Kotlin client.
- Lucene search should target field `__full_text__` with operator `MATCHES` and value `{ queryText, minScore }`.
- `db.search()` should default the table to `ALL`; table-specific search keeps the given table.
- Request bodies must include `"minScore": null` when the caller omits it.
- Searches must compose with other predicates via `AND`.
- Add runnable examples that demonstrate table searches, all-table searches, minScore usage, and combining search with other filters.

## Plan
1. Add a typed `FullTextQuery` value helper and condition helper for search, exporting it publicly.
2. Extend `IQueryBuilder`/implementation and `IOnyxDatabase` to support `.search(text, minScore?)`, ensuring table defaults to `ALL` for the facade helper and that conditions AND with existing filters.
3. Add unit coverage to assert the serialized payloads (table-specific, ALL, with/without minScore, combined conditions).
4. Document the API (README) and add runnable examples for table search, all-table search, and combined predicates.
5. Add a changelog entry describing the new search support.

## Acceptance Criteria
- [x] TypeScript SDK supports `.search(text, minScore?)` on `db` for all tables and on query builders for specific tables.
- [x] Generated request payloads match the documented Lucene search shape, including `"table": "ALL"` and `"minScore": null` when omitted.
- [x] Search predicates compose with other conditions using `AND`.
- [x] New examples cover table search, all-table search, and search combined with other filters.
- [x] README/docs updated to show the new search API.

Tests: `npm test`
