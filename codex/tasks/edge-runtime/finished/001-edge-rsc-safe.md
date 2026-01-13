# Task: Make SDK edge/RSC-safe (no dynamic Node imports)

## Goal
Remove the need for Next.js apps to set `serverExternalPackages` or force Node runtime by ensuring the SDK exposes an edge-compatible entry point and avoids dynamic imports of Node built-ins in shared paths.

## Scope / Requirements
- Eliminate dynamic import() of fs, path, process in code that can be bundled for edge/RSC. Keep Node-only code gated behind a Node-specific entry.
- Provide conditional exports so bundlers can pick the right build (e.g., index.js" } or similar).
- Ensure the edge build never references Node globals/modules; it should resolve config via env only (or throw a clear error when file-based config is requested).
- Maintain existing Node functionality (env + file-based config, schema codegen) in the Node entry.
- Add tests:
  - Unit tests for config resolution on Node (env + file-based) and edge (env-only).
  - A minimal Next app (Turbopack) integration test that imports the SDK in an app route without serverExternalPackages and succeeds.
  - (Optional) Cloudflare Worker smoke test that initializes the edge entry with env config.
- Update docs: mention the edge entry and any limitations (no file-based config on edge).

## Acceptance criteria
- Next.js app route using the SDK on the default runtime builds and responds without “module as expression is too dynamic” or similar bundling errors.
- Cloudflare Worker example runs with env config only.
- Existing Node users remain unaffected.

## Notes / pointers
- Current issue surfaces at 62ed7_b812d382._.js when dynamic imports to fs/path are seen during bundling.
- Prior workaround in consuming app was serverExternalPackages: ["@onyx.dev/onyx-database"] plus export const runtime = 'nodejs' on API routes; this task removes that requirement.

## Plan
1. Add an edge-only config resolver and edge onyx entry that avoid Node imports and file-based config.
2. Wire tsup and package.json exports for the edge entry, keeping Node entry intact.
3. Add unit tests for edge config resolution and integration tests for Next app + optional Cloudflare worker smoke.
4. Update README with edge usage and limitations.
5. Run build/tests, add changelog, and finalize task move to finished.

## Acceptance Criteria Checklist
- [x] Edge entry uses env-only config with clear error on file-based config.
- [x] Node entry still supports env + file-based config resolution.
- [x] Next Turbopack integration test builds and responds without externalization.
- [x] Cloudflare Worker edge usage documented or smoke tested.
- [x] Docs updated and changelog added.
