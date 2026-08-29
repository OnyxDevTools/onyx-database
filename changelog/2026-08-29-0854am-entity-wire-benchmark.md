# Change: Add reproducible entity wire-format benchmark

- Date: 2026-08-29 08:54 AM MT
- Author/Agent: Codex
- Scope: lib, tooling, docs
- Type: chore
- Summary:
  - add a fixed-iteration JSON versus MessagePack encode/decode microbenchmark
  - report raw and gzip-6 packet sizes for a deterministic recursive entity fixture
  - document a reproducible command, methodology, reference environment, and observed results
  - remove obsolete depth parameters from the existing codec's limit helpers to keep lint clean

- Impact:
  - no runtime or public API changes; uses existing development dependencies only

- Follow-ups:
  - repeat on release hardware when comparing future codec changes
