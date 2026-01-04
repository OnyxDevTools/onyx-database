# Change: implement `in` wrapper helper

- Date: 2026-01-03 05:14 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - Added a concrete `in` helper that wraps `inOp` (exported via alias-friendly name) for use alongside inner queries.
  - Adjusted implementation to remain compatible with TypeScript overloads after removing the direct alias.

- Impact:
  Developer ergonomics; runtime behavior unchanged.

- Follow-ups:
  None.
