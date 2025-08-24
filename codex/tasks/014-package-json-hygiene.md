# Task: package.json hygiene

## Goal
Accurate metadata and clean publish.

## Steps
1. Fill in:
   - `"name"`, `"version"`, `"description"`, `"keywords"`
   - `"repository"`, `"bugs"`, `"homepage"`
   - `"author"`, `"license"`
2. Add `"engines": { "node": ">=18" }".
3. Ensure `"files"` whitelist is present to avoid shipping junk.

## Acceptance Criteria
- `npm pack --dry-run` shows only intended files (dist, src if desired, docs if desired, root meta).
