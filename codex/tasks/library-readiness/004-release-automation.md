# Task: Versioning & releases (Changesets)

## Goal
Automate semver, changelog, and npm publish.

## Steps
1. Install: `npm i -D @changesets/cli`
2. Run `npx changesets init`.
3. Add GitHub Action `.github/workflows/release.yml`:
   - On push to `main`, `changesets/action` creates/release PR.
   - On tag, publish to npm (requires `NPM_TOKEN`).
4. Scripts:
   - `"changeset": "changeset"`
   - `"release": "changeset publish"`

## Acceptance Criteria
- Creating a changeset generates a release PR with version bump and changelog.
- Tagging publishes to npm in CI (dry run acceptable initially).
