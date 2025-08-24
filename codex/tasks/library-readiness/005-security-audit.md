# Task: Security & dependency updates

## Goal
Baseline security posture.

## Steps
1. Enable GitHub Dependabot:
   - `.github/dependabot.yml` for npm weekly updates.
2. Add `npm run audit` to CI (allow low/moderate non-blocking).
3. Add `SECURITY.md` describing how to report vulnerabilities.

## Acceptance Criteria
- Dependabot opens PRs for outdated deps.
- `SECURITY.md` present and linked in README.
