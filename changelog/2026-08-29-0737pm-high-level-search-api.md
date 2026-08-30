# Change: Add high-level lexical, semantic, and hybrid search API

- Date: 2026-08-29 07:37 PM MT
- Author/Agent: Codex
- Scope: lib | docs | tests
- Type: feat
- Summary:
  - Add an options overload for lexical, semantic, and hybrid natural-language search; an omitted mode defaults to hybrid.
  - Canonicalize `SEARCH` wire values with `mode = "hybrid"`, `match = "any"`, `minScore = null`, and `maxCandidates = 1000` defaults.
  - Validate search text, normalized score range (`0..1`), mode, match policy, and candidate bounds before transport, including hybrid's two-candidate minimum.
  - Keep all legacy `search(text, minScore?)` and low-level vector-search overloads wire-compatible.
  - Allow normal filter composition while rejecting update and delete execution for high-level searches.
  - Recursively reject duplicate/mis-targeted `SEARCH`, mixed `__full_text__` predicates, and unsupported live query streams before transport.
  - Type high-level database-wide results as `FullTextSearchResult`, including their normalized nullable score, and prevent `ALL` search from inheriting a default partition.

- Impact:
  - Applications can select lexical, semantic, or hybrid behavior without constructing internal query criteria or embedding metadata.
  - Semantic and hybrid retrieval require a configured server embedding provider and searchable records backfilled into the same vector space.

- Follow-ups:
  - Release alongside a server/database version that supports the `SEARCH` operator.
