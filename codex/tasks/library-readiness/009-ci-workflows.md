# Task: GitHub Actions CI

## Goal
Automated lint, test, build on push/PR.

## Steps
1. Add `.github/workflows/ci.yml`:
   - Triggers: push, pull_request
   - Matrix: Node 18, 20
   - Steps: checkout, setup-node, install, lint, test, build
2. Cache npm with actions/setup-node cache.

## Acceptance Criteria
- Opening a PR triggers CI.
- All jobs pass on supported Node versions.
