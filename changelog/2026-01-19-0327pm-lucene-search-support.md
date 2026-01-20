# Change: Lucene full-text search support

- Date: 2026-01-19 03:27 PM PST
- Author/Agent: Codex
- Scope: lib, examples, docs
- Type: feat
- Summary:
  - Added `search` helpers and builder methods for Lucene full-text queries, including `db.search()` targeting table `ALL`.
  - Ensured query payloads carry `table` and `minScore` (null when omitted) to mirror Kotlin client behavior.
  - Documented the API and added runnable examples for table-specific, ALL-table, and combined search predicates.

- Impact:
  - Public API gains `.search` on query builders and the database facade; select query bodies now include `table`.

- Follow-ups:
  - None.
