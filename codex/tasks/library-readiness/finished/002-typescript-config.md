# Task: Configure TypeScript (strict)

## Goal
Enable strict TypeScript with separate build output directories for ESM/CJS.

## Steps
1. Install TS: `npm i -D typescript`
2. Create `tsconfig.base.json` with:
   - `"strict": true`
   - `"declaration": true`, `"declarationMap": true`
   - `"sourceMap": true`
   - `"moduleResolution": "bundler"`
   - `"target": "ES2022"`
   - `"module": "ES2022"`
   - `"types": []`
   - `"skipLibCheck": false`
3. Create `tsconfig.build.esm.json` and `tsconfig.build.cjs.json`:
   - ESM: `"outDir": "dist/esm"`, `"module": "ES2022"`
   - CJS: `"outDir": "dist/cjs"`, `"module": "CommonJS"`
4. Ensure `include` points to `src`.

## Acceptance Criteria
- `npx tsc -p tsconfig.build.esm.json` and `npx tsc -p tsconfig.build.cjs.json` both succeed.
- `dist/esm` and `dist/cjs` contain compiled JS and `.d.ts` files.
