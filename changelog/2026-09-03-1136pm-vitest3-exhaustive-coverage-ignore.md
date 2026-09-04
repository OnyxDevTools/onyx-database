# Change: Preserve exhaustive MessagePack coverage across Vitest versions

- Date: 2026-09-03 11:36 PM MT
- Author/Agent: Codex
- Scope: tooling
- Type: test
- Summary:
  - Add Istanbul and line-counted V8 coverage annotations to the unreachable default of the exhaustive MessagePack marker decoder.
  - Keep 100% coverage enforcement compatible with the Node 18-compatible Vitest 3 toolchain.

- Impact:
  - Test coverage reporting remains green without changing runtime behavior.

- Follow-ups:
  - None.
