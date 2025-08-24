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

## Plan
1. Add `@changesets/cli` as a dev dependency.
2. Initialize changesets configuration with `npx changeset init`.
3. Create `.github/workflows/release.yml`:
   - Use `changesets/action` to open version PR on pushes to `main`.
   - On tagged releases, run `npm publish` using `NPM_TOKEN`; start with `--dry-run`.
4. Add npm scripts `"changeset"` and `"release"` to `package.json`.
5. Commit changes and document release workflow in README if needed.

## Acceptance Criteria
- [x] Creating a changeset generates a release PR with version bump and changelog.
- [x] Tagging publishes to npm in CI (dry run acceptable initially).
