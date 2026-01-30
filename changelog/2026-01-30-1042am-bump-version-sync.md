# Change: Keep sdkVersion in sync with package version

- Date: 2026-01-30 10:42 AM PT
- Author/Agent: Codex
- Scope: lib, tooling
- Type: fix
- Summary:
  - Inject sdk metadata via tsup define and shared version module to eliminate stale hard-coded version strings.
  - Update edge entry test to assert sdk metadata matches package.json.
  - Make bump-version script pull the latest main before tagging to avoid publishing stale builds.
  - Skip example gating when the local Onyx config file is absent, preventing false failures in environments without secrets.
  - Fix example runner to keep iterating and report results under `set -e`.
  - Auto-commit/push dirty working trees (with user-provided message) before continuing the bump flow when on main.
  - Simplify prompt defaults to avoid shell parsing issues during the bump script.

- Impact:
  - sdkVersion now tracks package version at build time; release tags pick up current main before publish.

- Follow-ups:
  - Retag/release 2.0.x after verifying the latest build contents.
