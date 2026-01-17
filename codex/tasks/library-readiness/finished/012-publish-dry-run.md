# Task: Publish dry-run

## Goal
Validate publish contents and metadata.

## Steps
1. Run `npm pack --dry-run` and inspect file list.
2. Run `npm publish --dry-run`.
3. Adjust `"files"` and build if necessary.

## Plan
1. Build the project to generate the `dist/` outputs.
2. Execute `npm pack --dry-run` and review the tarball file list for expected entries.
3. Execute `npm publish --dry-run` to validate metadata and registry checks.
4. Update `package.json` `"files"` or build artifacts if any files are missing or extraneous.
5. Repeat the dry-run commands until the output matches the intended publish contents.

## Acceptance Criteria
- [x] Dry-run shows correct files and entry points.
- [x] No missing `types` or mismatched exports.

## Notes
- `npm pack --dry-run` and `npm publish --dry-run` include only dist builds, LICENSE, README, and package.json.
- Normalized `bin` paths and repository object in `package.json` to avoid npm publish warnings.
- Dry-run publish still errors on version `1.0.2` already existing, as expected.
