# Task: Bundle with tsup

## Goal
Fast, tree-shakeable builds for ESM and CJS.

## Steps
1. Install: `npm i -D tsup`
2. Add `tsup.config.ts`:
   - entry: `src/index.ts`
   - format: `['esm','cjs']`
   - dts: true, sourcemap: true, clean: true, splitting: false
   - outDir: `dist`
3. Scripts:
   - `"build": "tsup"`
   - `"clean": "rimraf dist"` (`npm i -D rimraf`)

## Acceptance Criteria
- `npm run build` generates `dist/` with ESM/CJS and types.
- Importable from both `require()` and `import`.
