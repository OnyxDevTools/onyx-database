# Change: Make schema types forward-compatible

- Date: 2026-01-08 01:25 PM PST
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - add index signatures to schema types so newer schema fields pass through without being dropped
  - improves compatibility for older tooling when Onyx adds new schema properties (e.g., resolvers)

- Impact:
  Types are more permissive; runtime behavior unchanged.

- Follow-ups:
  None.
