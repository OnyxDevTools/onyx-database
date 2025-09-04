# Task: Add exponential retry for stream reconnections

Implement exponential backoff retry logic for streaming connections that drop.

## Plan
1. Update `src/core/stream.ts` to track retry attempts and delay reconnects using exponential backoff starting at 1s and capping at 30s.
2. Reset retry counter on successful connection so future reconnects start fresh.
3. Add tests verifying exponential retry behaviour.
4. Cap total retry attempts at four to avoid infinite reconnect loops.
5. Document the change in the changelog.

## Acceptance Criteria
- [x] Stream reconnections use exponential backoff up to a cap.
- [x] Unit tests cover retry behaviour.
- [x] Retry attempts are limited to four.
