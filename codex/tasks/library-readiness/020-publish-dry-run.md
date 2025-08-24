# Task: Publish dry-run

## Goal
Validate publish contents and metadata.

## Steps
1. Run `npm pack --dry-run` and inspect file list.
2. Run `npm publish --dry-run`.
3. Adjust `"files"` and build if necessary.

## Acceptance Criteria
- Dry-run shows correct files and entry points.
- No missing `types` or mismatched exports.
