# Task: API docs with TypeDoc

## Goal
Auto-generate typed API docs.

## Steps
1. Install: `npm i -D typedoc typedoc-plugin-markdown`
2. Add `typedoc.json` with `entryPoints: ["src/index.ts"]`, `out: "docs"`, markdown plugin enabled.
3. Script: `"docs": "typedoc"`

## Plan: API docs with TypeDoc

1. Install `typedoc` and `typedoc-plugin-markdown` as dev dependencies.
2. Create `typedoc.json` configured with `entryPoints: ["src/index.ts"]`, output directory `docs`, and enable the markdown plugin.
3. Add a `docs` npm script in `package.json` that runs `typedoc`.
4. Run `npm run docs` to generate the `docs/` directory.
5. Update `README.md` with a link to `./docs`.

## Acceptance Criteria
- [x] `npm run docs` produces `docs/` with generated API reference.
- [x] README links to `./docs`.
