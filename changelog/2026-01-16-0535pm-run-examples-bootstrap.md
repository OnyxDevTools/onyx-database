# Change: run-examples invokes bootstrap

- Date: 2026-01-16 05:35 PM PT
- Author/Agent: Codex
- Scope: tooling
- Type: chore
- Summary:
  - Updated `scripts/run-examples.sh` to call `scripts/bootstrap.sh` up front so dependencies, builds, and generated types are ensured before running examples.

- Impact:
  - Reduces manual setup risk; no runtime behavior changes to the SDK itself.

- Follow-ups:
  - None noted.
