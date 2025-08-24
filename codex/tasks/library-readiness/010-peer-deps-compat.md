# Task: Peer dependency strategy

## Goal
Avoid bundling heavy externals; validate peer ranges.

## Steps
1. If applicable, declare `"peerDependencies"` (e.g., `react` for React libs) with semver ranges and mirror in `"devDependencies"` for testing.
2. Add compatibility tests matrix in CI (if peers like React, test v18/19).
3. Document peers in README Install.

## Acceptance Criteria
- `npm info` shows peers correctly.
- CI matrix ensures compatibility with targeted peer versions.
