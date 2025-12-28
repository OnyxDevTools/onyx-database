# Change: align coverage provider with Node 18

- Date: 2025-12-28 10:01 PM UTC
- Author/Agent: automation
- Scope: tooling
- Type: chore
- Summary:
  - Switch Vitest coverage provider to Istanbul for Node 18 runtimes to avoid missing inspector/promises module errors.
  - Keep V8 coverage for Node 20+ while retaining existing thresholds and reports.
- Impact:
  - Test coverage now runs successfully on Node 18 without relying on unavailable built-ins.
- Follow-ups:
  - None.
