# Change: Add Istanbul coverage dependency

- Date: 2025-12-28 02:09 PM PT
- Author/Agent: automation
- Scope: tooling
- Type: chore
- Summary:
  - Added @vitest/coverage-istanbul as a dev dependency to match the configured Node <20 coverage provider.
  - Ensured coverage runs can resolve Istanbul without manual installation.
- Impact:
  - Keeps Node 18 coverage runs working without affecting runtime code.
- Follow-ups:
  - None
