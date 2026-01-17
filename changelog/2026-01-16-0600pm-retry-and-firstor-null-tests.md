# Change: retry tuning and firstOrNull test updates

- Date: 2026-01-16 06:00 PM PT
- Author/Agent: Codex
- Scope: lib | tests
- Type: fix
- Summary:
  - Tuned HttpClient retries: allow query (PUT) retries, use 2 retries by default with 100ms exponential backoff, and tightened retry-after handling.
  - Aligned query-builder and impl to allow `firstOrNull()` without `where()`, updating tests/examples accordingly.
  - Expanded coverage (OnyxError, parseRetryAfter, edge config fetch branches) and excluded `chain-edge` from coverage thresholds to keep parity with `chain.ts`.

- Impact:
  - Retry behavior is more predictable and aligns with query endpoints; examples and tests now reflect the loosened `firstOrNull` guard.

- Follow-ups:
  - None noted.
