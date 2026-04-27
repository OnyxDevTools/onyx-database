# Change: harden example smoke flows against transient backend timing

- Date: 2026-04-26 08:12 PM PT
- Author/Agent: Codex (GPT-5)
- Scope: examples
- Type: fix
- Summary:
  - replace fixed post-publish sleeps in `examples/schema/basic.ts` with bounded polling for schema visibility
  - add transient retry/backoff around `examples/ai/chat.ts` for backend 5xx and timeout failures
  - poll for required tables in `examples/seed.ts` after schema publish to reduce seed-time flakiness

- Impact:
  - reduces flaky failures in `scripts/run-examples.sh` and `scripts/bump-version.sh`
  - no public SDK API changes

- Follow-ups:
  - none
