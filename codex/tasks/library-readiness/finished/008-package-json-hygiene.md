# Task: package.json hygiene

## Goal
Accurate metadata and clean publish.

## Steps
1. Fill in:
   - `"name"`, `"version"`, `"description"`, `"keywords"`
   - `"repository"`, `"bugs"`, `"homepage"`
   - `"author"`, `"license"`
2. Add `"engines": { "node": ">=18" }`.
3. Ensure `"files"` whitelist is present to avoid shipping junk.

## Plan
1. Review current `package.json` and populate missing metadata fields (`name`, `version`, etc.).
2. Insert `"engines"` field specifying Node 18+ support.
3. Define a `"files"` array whitelisting `dist/`, necessary source or doc files, and root metadata.
4. Run `npm pack --dry-run` and confirm only expected files are included.
5. Commit updates to `package.json`.

## Acceptance Criteria
- [x] `npm pack --dry-run` shows only intended files (dist, src if desired, docs if desired, root meta).
