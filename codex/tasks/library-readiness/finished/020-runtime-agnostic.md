# Task 020: runtime agnostic library

## Task
Refactor the library to remove Node.js runtime dependencies so it works in both Node and Cloudflare Workers.

## Plan
1. Replace direct `process` usage with optional `globalThis` checks.
2. Drop project/home file config resolution and any `node:` imports.
3. Update stream debug logging to use `globalThis.process`.
4. Build the library for a neutral platform instead of Node.
5. Update tests and README for the new config behavior.
6. Add a changelog entry.

## Acceptance Criteria
- [x] No `node:` imports remain in library source.
- [x] Config resolves from env or explicit input only.
- [x] Build uses neutral platform and passes lint, typecheck, tests.
- [x] README notes Cloudflare Workers support.
- [x] Changelog entry added.
