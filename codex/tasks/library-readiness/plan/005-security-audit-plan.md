# Task: Security & dependency updates

## Goal
Baseline security posture.

## Steps
1. Enable GitHub Dependabot:
   - `.github/dependabot.yml` for npm weekly updates.
2. Add `npm run audit` to CI (allow low/moderate non-blocking).
3. Add `SECURITY.md` describing how to report vulnerabilities.

## Plan
1. Create `.github/dependabot.yml` configuring weekly npm dependency checks for the main package and examples workspace.
2. Extend `.github/workflows/ci.yml` to run `npm audit --audit-level=high` and continue on low/moderate findings.
3. Draft `SECURITY.md` outlining supported versions and disclosure process.
4. Link `SECURITY.md` from `README.md`.

## Acceptance Criteria
- [ ] Dependabot opens PRs for outdated deps.
- [ ] `SECURITY.md` present and linked in README.
