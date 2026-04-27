# Change: update GitHub Actions workflow dependencies for Node 24

- Date: 2026-04-26 09:30 PM PT
- Author/Agent: Codex (GPT-5)
- Scope: tooling
- Type: chore
- Summary:
  - bump `actions/checkout` from `v4` to `v5` in CI and release workflows to move off the Node 20 action runtime
  - bump `dorny/paths-filter` from `v3` to `v4` in CI so changed-file detection uses a Node 24-compatible action release
  - bump `actions/setup-node` from `v4` to `v5` in CI and release workflows to avoid the same Node 20 runner deprecation class

- Impact:
  - removes current GitHub Actions Node 20 deprecation warnings for the updated workflow actions
  - keeps workflow behavior effectively unchanged while staying on Node 24-compatible action majors

- Follow-ups:
  - consider moving to `actions/checkout@v6` and `actions/setup-node@v6` later if you want the latest majors rather than the minimal Node 24-compatible bumps
