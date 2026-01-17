# Change: publish dry-run cleanup and query/update example fix

- Date: 2026-01-16 05:13 PM PT
- Author/Agent: Codex
- Scope: tooling
- Type: fix
- Summary:
  - Normalized `package.json` bin paths and repository metadata so npm publish dry-runs match expected output without warnings.
  - Ensured `examples/query/update.ts` seeds a target user before updating and verifies the updated record.
  - Reran `./scripts/run-examples.sh` to confirm the query/update example and suite now pass.

- Impact:
  - No public API changes; publish contents unchanged aside from metadata normalization and warning cleanup. Example suite reliability improved.

- Follow-ups:
  - Next publish still requires a version bump to avoid the existing 1.0.2 release conflict.
