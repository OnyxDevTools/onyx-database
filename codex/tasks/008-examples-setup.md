# Task: Minimal examples/

## Goal
Provide runnable TypeScript examples.

## Steps
1. Create `examples/` with:
   - `basic-usage.ts` importing the library from `dist` during local dev (`ts-node` or `tsx`).
2. Add `examples/package.json` with `type: "module"` and a script `"start": "tsx basic-usage.ts"`.
   - Install `tsx` as dev dep in root and reference via `npx`.
3. Ensure examples import from the package name once published; during local dev use `tsconfig.paths` or `npm link`.

## Acceptance Criteria
- `npx tsx examples/basic-usage.ts` runs and outputs expected behavior.
- Example code compiles with TS and no `any` usage.
