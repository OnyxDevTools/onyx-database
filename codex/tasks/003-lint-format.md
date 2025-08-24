# Task: ESLint + Prettier setup

## Goal
Strict linting and consistent formatting.

## Steps
1. Install: `npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-import prettier`
2. Add `.eslintrc.cjs` with:
   - parser: `@typescript-eslint/parser`
   - plugins: `@typescript-eslint`, `import`
   - extends: `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:import/recommended`, `plugin:import/typescript`, `prettier`
   - rules: no default export (prefer named), sorted imports optional, no-explicit-any (warn), no-floating-promises, etc.
3. Add `.prettierrc.json` with sane defaults.
4. Add scripts:
   - `"lint": "eslint . --ext .ts"`
   - `"format": "prettier --write ."`

## Acceptance Criteria
- `npm run lint` reports no errors on baseline code.
- `npm run format` completes without changes after initial run.
