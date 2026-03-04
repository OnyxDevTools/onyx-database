# Change: harden schema example against publish lock contention

- Date: 2026-03-03 06:48 PM PT
- Author/Agent: Codex (GPT-5)
- Scope: examples
- Type: fix
- Summary:
  - add retry/backoff in `examples/schema/basic.ts` when schema publish is already in progress
  - use a per-run unique temporary table name to avoid collisions from prior interrupted runs
  - keep cleanup behavior so the example restores schema state after completion

- Impact:
  - reduces flaky failures in `scripts/run-examples.sh` and `scripts/bump-version.sh`
  - no public SDK API changes

- Follow-ups:
  - none
