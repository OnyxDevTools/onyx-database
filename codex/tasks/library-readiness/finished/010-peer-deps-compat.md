# Task: Peer dependency strategy

## Goal
Avoid bundling heavy externals; validate peer ranges.

## Steps
1. If applicable, declare `"peerDependencies"` (e.g., `react` for React libs) with semver ranges and mirror in `"devDependencies"` for testing.
2. Add compatibility tests matrix in CI (if peers like React, test v18/19).
3. Document peers in README Install.

## Plan
1. Audit the project for external libraries that should be listed as peers instead of bundled dependencies.
2. For each identified peer, add matching entries under `"peerDependencies"` and `"devDependencies"` in `package.json`.
3. Extend the CI configuration to run tests against a matrix of supported peer versions.
4. Update the README installation instructions to mention required peers and supported versions.
5. Run `npm info @onyx.dev/onyx-database peerDependencies` to confirm peers are exposed.

## Acceptance Criteria
- [x] `package.json` lists required `peerDependencies` mirrored in `devDependencies` (none required).
- [x] CI matrix tests all supported peer versions (no peers to test).
- [x] README install section documents peer dependencies (no peers required).
- [ ] `npm info` displays the declared peers (package not published).
