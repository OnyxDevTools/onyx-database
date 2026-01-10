# Change: Run TypeScript examples as regression checks

- Date: 2026-01-08 02:35 PM PST
- Author/Agent: Codex
- Scope: examples, tooling
- Type: chore
- Summary:
  - converted `scripts/run-examples.sh` to execute TypeScript examples via `tsx`, installing/bootstrapping the examples workspace as needed
  - standardized all examples to emit a common completion marker for regression runs while keeping them readable
  - seed step now runs once up front and, if required tables are missing, marks examples as skipped rather than failing noisily

- Impact:
  Example runtime only; no SDK/CLI behavior changes.

- Follow-ups:
  None.
