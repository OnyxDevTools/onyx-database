# Task: API docs with TypeDoc

## Goal
Auto-generate typed API docs.

## Steps
1. Install: `npm i -D typedoc typedoc-plugin-markdown`
2. Add `typedoc.json` with `entryPoints: ["src/index.ts"]`, `out: "docs"`, markdown plugin enabled.
3. Script: `"docs": "typedoc"`

## Acceptance Criteria
- `npm run docs` produces `docs/` with generated API reference.
- README links to `./docs`.
