# Change: Consolidate schema examples

- Date: 2026-01-06 10:21 AM PST
- Author/Agent: Codex
- Scope: examples
- Type: docs
- Summary:
  - replace multiple schema example scripts with a single end-to-end example that fetches, diffs, validates, publishes, and restores schema changes
  - ensure the flow exercises add/remove cycles while returning the schema to its original shape
  - add retry handling when a publish is already in progress to avoid transient failures

- Impact:
  Examples only; no library or CLI behavior changes.

- Follow-ups:
  None.
