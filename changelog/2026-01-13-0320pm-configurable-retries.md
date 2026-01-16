# Change: Configurable HTTP retries

- Date: 2026-01-13 03:20 PM PST
- Author/Agent: Codex
- Scope: lib
- Type: feat
- Summary:
  - Add `retry` options to `OnyxConfig` (enabled flag, `maxRetries`, and `initialDelayMs` defaults: on, 3 retries, 300ms).
  - HTTP client now uses Fibonacci backoff starting at 300ms for retryable GET requests, honors server `Retry-After` when present, and can be disabled via config.
  - Resolved config propagates retry settings to all fetch calls.

- Impact:
  - Public config surface expanded; default retry behavior remains enabled with Fibonacci delays on GET requests only and respects server `Retry-After`.

- Follow-ups:
  - Consider exposing retry options via env vars if needed.
