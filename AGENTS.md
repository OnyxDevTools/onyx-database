<!-- filename: AGENTS.md -->
# Onyx Database TypeScript SDK — Agent Guide

This guide orients **automated coding agents** to the repository’s structure, contracts, and conventions so changes remain correct, minimal, and safe.

---

## Mission & Scope

- Deliver a **zero‑dependency**, strict **TypeScript** client for **Onyx Cloud Database**.
- Provide an ergonomic **builder pattern** for reading/writing data, streaming changes, and working with documents.
- Include a small **code generator** that emits table interfaces, a `tables` enum, and a `Schema` map from a user’s Onyx schema.
- Ship **ESM + CJS** builds with `.d.ts` types; support Node **18+**.

> **Never add runtime dependencies.** Dev‑time tooling is fine (tsup, TypeScript, vitest, eslint), but runtime must remain dependency‑free.

---

## Project Tree (key paths)

```
.
├── .eslintrc.json
├── codex/
│   └── tasks/
│       ├── done/
│       |   ├── 001-task-title.md
|       ├── plan/
|       |   ├── 001-task-title-plan.md
|       ├── 001-task-title.md
├── dist/                      # build output (ESM/CJS + CLI)
│   ├── gen/cli/generate.(cjs|js|*.map)
│   ├── index.(cjs|js|*.map)
│   ├── index.d.(cts|ts)
│   └── index.js.map
├── examples/
│   ├── onyx/                  # generated types live here
│   │   └── types.ts
│   ├── onyx.schema.json       # sample schema for codegen
│   ├── package.json           # depends on file:.. to link SDK
│   ├── query/
│   │   ├── basic.ts
│   │   └── resolver.ts
│   ├── save/basic.ts
│   └── tsconfig.json
├── gen/                       # codegen implementation (additive)
│   ├── cli/generate.ts        # CLI entry (compiled to dist/gen/cli/generate)
│   ├── emit.ts                # TS emitter (types + tables enum)
│   └── generate.ts            # programmatic API + I/O
├── package.json
├── README.md
├── scripts/
│   └── bootstrap.sh           # internal dev bootstrap (idempotent)
├── src/
│   ├── builders/              # builder implementations
│   │   ├── cascade-builder.ts
│   │   ├── condition-builder.ts
│   │   ├── query-builder.ts
│   │   └── save-builder.ts
│   ├── config/
│   │   ├── chain.ts           # credential/config resolution chain
│   │   └── defaults.ts
│   ├── core/
│   │   ├── http.ts            # small fetch wrapper + errors
│   │   └── stream.ts          # JSON-lines streaming reader
│   ├── errors/
│   │   ├── config-error.ts
│   │   └── http-error.ts
│   ├── helpers/
│   │   ├── aggregates.ts
│   │   ├── conditions.ts
│   │   └── sort.ts
│   ├── impl/
│   │   └── onyx.ts            # facade implementation (onyx.init)
│   ├── index.ts               # public entry; re-exports
│   └── types/
│       ├── builders.ts
│       ├── common.ts
│       ├── protocol.ts
│       └── public.ts          # IOnyxDatabase (public contract)
├── tsconfig.json
└── tsup.config.ts             # build config (lib + CLI entries)
```

---

## Codex Task and Plan Workflow

Agents are expected to manage work items under the \`codex/tasks/{epicName}/\` folder. Each **epic** has its own folder, containing a series of task files (\`NNN-task-title.md\`) and two subfolders for status management:

\`\`\`
codex/
└── tasks/
    └── {epicName}/
        ├── 001-task-title.md
        ├── 002-task-title.md
        ├── plan/
        │   └── 001-task-title-plan.md
        └── finished/
            └── 001-task-title.md
\`\`\`

### Conventions

- **Root tasks**: Contain the initial task description, acceptance criteria, and any supporting notes.  
- **plan/**: Agents create a \`*-plan.md\` file here that breaks down how they will accomplish the root task. Keep it concise, ordered, and actionable. a plan should always have an acceptance criteria checkbox list at the end. the plan file should contains the original task content, and should delete the task from the the root of the epic, this will indicate that its in progress. 
- **finished/**: When a task is completed, the file moves here.  first evaluate evaluate if the acceptance criteria is met and check off the items that are and move the task to the finished folder. we can remove the -plan suffix. we can remove the task from the /plan folder. the finished file will contain the task, plan, and updated acceptance criteria. 

### Process

1. **New Task**: Start with the \`NNN-task-title.md\` file in the epic’s root.  
2. **Planning**: Move file to a corresponding \`NNN-task-title-plan.md\` in \`/plan\` with step-by-step execution details.  
3. **Execution**: Implement the code or docs changes as specified in the task.  
4. **Completion**: Once accepted, move the task plan file into \`/finished\`. Remove the `*-plan` suffix. 
5. **Changelog**: For any code or doc changes, also add a \`changelog/YYYY-MM-DD-HHMM-task-desc.md\` file (see [Commit & Changelog Requirements](#commit--changelog-requirements)).  

### Guidelines

- Always preserve the **task order and numbering** (\`NNN-...\`).  
- Plans should be **short, direct, and prescriptive** so other agents can follow or audit.  
- Never delete tasks—archive them under \`finished/\`, unless specifically asked to clean them up
- Keep one task per file. If a task spawns sub-tasks, create new numbered task files.  


## Public API — Source of Truth

**Do not break the public contract.** The SDK’s exported interface is defined in:

- `src/types/public.ts` → `IOnyxDatabase`, `OnyxFacade`, `OnyxConfig`, and re‑exports of helper types.

If adding a feature:
1. Add types in `src/types/public.ts` (prefer additive changes).
2. Implement in `src/impl/onyx.ts` and, if needed, extend builders in `src/builders/*`.
3. Expose helpers (if any) via `src/index.ts`.
4. Update **README** examples if user‑facing.

---

## Where Things Live (edit map)

- **Initialization & credentials**: `src/impl/onyx.ts`, `src/config/chain.ts`, `src/config/defaults.ts`.
- **HTTP & errors**: `src/core/http.ts`, `src/errors/*`.
- **Streaming**: `src/core/stream.ts` (reader), and stream wiring in `src/builders/query-builder.ts`.
- **Query builder**: `src/builders/query-builder.ts` (list/page/count/delete/update/stream).
- **Save builder**: `src/builders/save-builder.ts` (builder flavor of save).
- **Cascade builder**: `src/builders/cascade-builder.ts`.
- **Conditions/sort/aggregates helpers**: `src/helpers/*`.
- **Codegen (CLI & programmatic)**: `gen/cli/generate.ts`, `gen/generate.ts`, `gen/emit.ts`.
- **Public exports**: `src/index.ts`.

---

## TypeScript Library Best Practices (project‑specific)

1. **Strict TS on**  
   `tsconfig.json` uses `"strict": true`. Keep it strict; prefer explicit types, avoid `any` unless surfaced by code‑gen choice or external schema requirements.

2. **Module system**  
   Use `"module":"NodeNext"` / `"moduleResolution":"NodeNext"`. Do **not** add file extensions in TS imports between internal sources; tsup resolves them for ESM/CJS outputs.

3. **Zero runtime deps**  
   Do not introduce runtime packages. If you need utilities, implement minimal helpers in `src/helpers/`.

4. **Public API stability**  
   Treat `src/types/public.ts` as a contract. Prefer additive changes. If you must break anything, add deprecations and update README/examples.

5. **Errors & messages**  
   - Config errors: throw `OnyxConfigError` with actionable hints.
   - HTTP errors: throw `HttpError` with status/message. Do **not** leak secrets.

6. **Fetch**  
   Use the injected `fetch` from the resolved config, or `globalThis.fetch` if available. Do not import isomorphic fetch libraries.

7. **Trees & side effects**  
   Keep code tree‑shakeable; avoid top‑level side effects. `package.json` sets `"sideEffects": false`.

8. **Dual build**  
   `tsup.config.ts` builds lib (ESM + CJS) + CLI entry. Keep outputs small; avoid large string templates or embedded assets.

9. **Testing**  
   Prefer `vitest` for unit tests. Co‑locate tests under `src/**/__tests__` or `tests/`. Avoid slow/network tests in CI unless mocked.

10. **Docs & examples**  
    Examples should import from the package name (or `file:..` in examples workspace), not deep internal paths. Keep examples short and runnable.

---

## Build, Lint, Test (for agents)

- **Build**: `npm run build` (tsup bundles lib and CLI; emits `dist/**` and `.d.ts`).
- **Typecheck**: `npm run typecheck`
- **Lint**: `npm run lint`
- **Tests**: `npm test` (vitest)
- **Examples**: see `examples/` `package.json` for `gen:onyx` and `start`.

> Do not publish from agents. Release automation is out of scope unless a task explicitly requests it.

---

## Code Generator (onyx‑gen)

- CLI entry compiled to `dist/gen/cli/generate.(cjs|js)`.
- Programmatic API: `gen/generate.ts`.
- Type emitter: `gen/emit.ts` (controls how interfaces, `Schema`, and `tables` enum are rendered).
- Defaults:
  - **No JSON emission** unless `--emit-json`.
  - `--out` accepts either a directory **or** a `.ts` file path.
  - Optional property strategy defaults to **`non-null`** (adds `?` to non‑nullable fields).
  - Timestamp mode defaults to **`string`**.

If adjusting codegen behavior, keep CLI flags backward‑compatible and update README.

---

## Common Change Scenarios

1. **Add a new query helper (e.g., `ilike`)**
   - Implement in `src/helpers/conditions.ts`.
   - Export from `src/index.ts`.
   - Update README “Query helpers” table.

2. **Add a builder step (e.g., `.inPartition()` enhancements)**
   - Extend `src/builders/query-builder.ts`.
   - Update `src/types/builders.ts` if types change.
   - Ensure fluent API returns the correct generic type.

3. **Adjust credential precedence**
   - Modify `src/config/chain.ts` only.
   - Keep documented precedence: **env > project file > home profile**.
   - Improve messages for missing keys and file patterns.

4. **Improve streaming backpressure/keep‑alive**
   - Tweak `src/core/stream.ts` and streaming loop in query builder.
   - Avoid blocking promises; handle line buffering safely.

---

## Commit & Changelog Requirements

- Use **clear, minimal commits**. Conventional commits are preferred:
  - `feat: add X`
  - `fix: correct Y`
  - `docs: update README`
  - `refactor: simplify Z`
  - `test: add coverage for ...`
  - `chore: build, tooling, CI`

- After **any change**, add a changelog file:

  ```
  changelog/2025-08-23-0626pm-change-desc.md
  ```

  **Template:**
  ```
  # Change: <short description>

  - Date: 2025-08-23 06:26 PM PT
  - Author/Agent: <name or automation id>
  - Scope: (lib | cli | examples | docs | tooling)
  - Type: (feat | fix | docs | refactor | test | chore)
  - Summary:
    <1–3 bullets describing what changed and why>

  - Impact:
    <public API?, behavior?, perf?, size?>

  - Follow-ups:
    <links to tasks or TODOs>
  ```

> Keep one change per file to reduce merge friction.

---

## Quality Checklist (pre‑PR)

- [ ] **Types compile**: `npm run typecheck`
- [ ] **Build passes**: `npm run build`
- [ ] **No runtime deps added**
- [ ] **Exports stable**: `src/types/public.ts` unchanged or additive
- [ ] **README updated** if user‑facing behavior changes
- [ ] **Examples still run** (if touched): `examples` `npm run gen:onyx` + `npm start`
- [ ] **Changelog file added** under `changelog/`

---

## Pitfalls & Tips

- **NodeNext resolution**: TS is allowed to use extensionless relative imports; bundling emits `.js` in ESM. Do not append `.js` extensions in TS source.
- **Global fetch**: Use the resolved `fetch` from config or `globalThis.fetch`. Do not add polyfills.
- **Error messages**: Keep them short, actionable, and free of secrets.
- **Streaming**: Ensure line buffering tolerates partial chunks; guard listeners against `null` or keep‑alive payloads.
- **Examples workspace**: It consumes the package via `file:..`. Running `npm install` in `examples/` wires `onyx-gen` into `node_modules/.bin`.

---

## Quick Locator (What to edit for …)

- **New public method** → `src/types/public.ts` (+ impl in `src/impl/onyx.ts`, builder if applicable)
- **Credential flow** → `src/config/chain.ts`
- **HTTP request** → `src/core/http.ts`
- **Streaming** → `src/core/stream.ts` and `src/builders/query-builder.ts`
- **Condition helper** → `src/helpers/conditions.ts`
- **Sort helper** → `src/helpers/sort.ts`
- **Aggregates** → `src/helpers/aggregates.ts`
- **CLI flags** → `gen/cli/generate.ts`
- **Type emission** → `gen/emit.ts`
- **Examples** → `examples/**`

---

## Contacts & Docs

- Product site: <https://onyx.dev/>
- Cloud console: <https://cloud.onyx.dev>
- Docs hub: <https://onyx.dev/documentation/>
- API docs: <https://onyx.dev/documentation/api-documentation/>

---
