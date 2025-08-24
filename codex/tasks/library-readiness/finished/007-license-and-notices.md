# Task: License and notices

## Goal
Clear licensing.

## Steps
1. Add `LICENSE` (MIT or Apache-2.0).
2. Add `NOTICE` if Apache-2.0 or if required by dependencies.
3. Reference license in `package.json` and README badge.

## Plan
1. Choose MIT license and create `LICENSE` file with license text.
2. Review dependencies to determine if a `NOTICE` file is required; add one if necessary. All dependencies are permissive, so no `NOTICE` file is needed.
3. Ensure `package.json` contains the matching `"license"` field.
4. Add a license badge and section to `README.md` referencing the chosen license.

## Acceptance Criteria
- [x] License file matches `package.json` `"license"`.
- [x] README shows license section/badge.
