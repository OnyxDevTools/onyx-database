# Task: Package.json dual exports

## Goal
Set proper `exports`, `main`, `module`, `types`.

## Steps
1. Update `package.json`:
   - `"type": "module"`
   - `"main": "./dist/index.cjs"`
   - `"module": "./dist/index.js"`
   - `"types": "./dist/index.d.ts"`
   - `"exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" } }`
2. Add `"sideEffects": false`
3. Add `"files": ["dist", "src", "README.md", "LICENSE"]`

## Acceptance Criteria
- `node -e "require('./dist/index.cjs')"` works.
- `node --input-type=module -e "import('./dist/index.js')"` works.
- TypeScript consumers resolve types without config tweaks.
