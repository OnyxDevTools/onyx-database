# Task: GitHub Actions CI

## Goal
Automated lint, test, build on push/PR.

## Steps
1. Add `.github/workflows/ci.yml`:
   - Triggers: push, pull_request
   - Matrix: Node 18, 20
   - Steps: checkout, setup-node, install, lint, test, build
2. Cache npm with actions/setup-node cache.

## Plan
1. Create `.github/workflows/ci.yml`.
2. Configure workflow to run on `push` and `pull_request` events.
3. Use a matrix with Node.js `18.x` and `20.x`.
4. Include steps:
   - `actions/checkout@v4`
   - `actions/setup-node@v4` with `node-version: ${{ matrix.node-version }}` and `cache: 'npm'`
   - `npm ci`
   - `npm run lint`
   - `npm test`
   - `npm run build`
5. Commit workflow file.

## Acceptance Criteria
- [x] Opening a PR triggers CI.
- [x] All jobs pass on supported Node versions.
