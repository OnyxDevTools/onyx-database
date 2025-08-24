<!-- filename: CONTRIBUTING.md -->
# Contributing to `@onyx.dev/onyx-database`

Thanks for your interest in contributing! This project is a **zero-dependency**, strict **TypeScript** SDK for the **Onyx Cloud Database** with an ergonomic builder API and a small schema **code generator**. Please read this guide before opening PRs.

---

## Table of contents

- [Contributing to `@onyx.dev/onyx-database`](#contributing-to-onyxdevonyx-database)
  - [Table of contents](#table-of-contents)
  - [Code of conduct](#code-of-conduct)
  - [Project goals \& guardrails](#project-goals--guardrails)
  - [Prerequisites](#prerequisites)
  - [Repository layout](#repository-layout)
  - [Local setup](#local-setup)
  - [Build, typecheck, lint, test](#build-typecheck-lint-test)
  - [Examples workspace](#examples-workspace)
  - [Schema codegen](#schema-codegen)
  - [Debugging in VS Code](#debugging-in-vs-code)
  - [Public API changes](#public-api-changes)
  - [Commit style \& PR checklist](#commit-style--pr-checklist)
  - [Changelog entries](#changelog-entries)
  - [Security \& secret handling](#security--secret-handling)
  - [Release process](#release-process)
  - [Questions](#questions)

---

## Code of conduct

Be respectful and constructive. We welcome issues and PRs that improve the SDK, developer experience, or documentation.

---

## Project goals & guardrails

- **Zero runtime dependencies.** Do not add packages that ship to end users.
- **Strict TypeScript.** Keep `strict: true` and prefer explicit types.
- **Dual module**: ESM + CJS with `.d.ts` types.
- **Stable public API.** Changes to `IOnyxDatabase` or exported helpers must be additive, or coordinated as a breaking change with docs updates.
- **Small surface area.** Favor composability via builders and helpers over many bespoke methods.

---

## Prerequisites

- **Node.js 18+** and **npm**.
- A GitHub account for issues/PRs.

> You do **not** need Onyx credentials to build/test; examples support local schema files.

---

## Repository layout

```plaintext
.
├── src/                     # SDK source (public API lives here)
│   ├── builders/            # query/save/cascade builders
│   ├── config/              # credential resolution chain
│   ├── core/                # http + stream primitives
│   ├── errors/              # typed errors
│   ├── helpers/             # eq/gt/asc/desc/aggregates...
│   ├── impl/onyx.ts         # facade: onyx.init() implementation
│   ├── index.ts             # public entrypoint
│   └── types/               # interfaces & contracts (public.ts is source of truth)
├── gen/                     # code generator (CLI + programmatic)
│   ├── cli/generate.ts      # CLI entry (compiled to dist/gen/cli/generate)
│   ├── emit.ts              # TS emitter (interfaces, Schema, tables enum)
│   └── generate.ts          # IO + API fetch + file writing
├── examples/                # consumer workspace (linked via file:..)
│   ├── onyx.schema.json     # sample schema
│   ├── onyx/types.ts        # generated types (gitignored)
│   └── query/save/...       # simple usage examples
├── dist/                    # build output (gitignored)
├── scripts/                 # internal helpers (e.g., bootstrap.sh)
├── README.md                # user docs
├── AGENTS.md                # repo guide for automation/agents
├── package.json             # build + CLI bin config
├── tsconfig.json
└── tsup.config.ts           # builds lib & CLI
```

---

## Local setup

```bash
# install root deps and build SDK + CLI
npm install
npm run build

# (optional) install example workspace deps
cd examples
npm install
```

---

## Build, typecheck, lint, test

```bash
# Build ESM + CJS + d.ts (lib) and CLI
npm run build

# TypeScript typecheck
npm run typecheck

# Lint
npm run lint

# Tests (vitest)
npm test
```

> The repository intentionally avoids runtime dependencies. Do not add any unless approved and scoped to dev/build only.

---

## Examples workspace

The `examples/` folder demonstrates usage. It links the SDK via `file:..`.

Common scripts:

```bash
# from examples/
npm run gen:onyx   # generate types from onyx.schema.json to onyx/types.ts
npm start          # run the current example (tsx)
```

> Keep examples minimal and focused on library usage (not on repo internals).

---

## Schema codegen

The `onyx-gen` CLI emits interfaces, a `Schema` map, and a `tables` enum. Examples:

```bash
# From API (uses same resolver as onyx.init)
npx onyx-gen --source api --out ./src/onyx/types.ts --name OnyxSchema

# From a local export
npx onyx-gen --source file --schema ./onyx.schema.json --out ./src/onyx/types.ts --name OnyxSchema
```

Key flags:
- `--out` accepts a directory **or** a `.ts` file path.
- JSON is **not** emitted by default (enable with `--emit-json`).
- `--timestamps` (`string|date|number`), `--prefix`, and `--optional` (`non-null|nullable|none`) control type style.

---

## Debugging in VS Code

A launch config is included to run **the currently open example** in debug mode:

```jsonc
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Examples: Debug current TS (tsx preload)",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/examples",
      "runtimeExecutable": "node",
      "runtimeArgs": ["--import=tsx", "--enable-source-maps"],
      "program": "${file}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "sourceMaps": true
    }
  ]
}
```

---

## Public API changes

- **Source of truth:** `src/types/public.ts`.
- Additive changes (new methods, optional params) are preferred.
- If you must refactor builders or the facade, keep generics stable and fluent return types intact.
- Update `README.md` examples and **AGENTS.md** when user-facing behavior changes.

---

## Commit style & PR checklist

Use **Conventional Commits**:

```
feat: add streaming keep-alive option
fix: correct credential fallback when profile missing
docs: expand Users/Roles/Permissions examples
refactor: extract parseJsonAllowNaN
test: add query-builder listAll tests
chore: bump tsup
```

**Before opening a PR:**

- [ ] `npm run typecheck` passes  
- [ ] `npm run build` passes (creates `dist/`)  
- [ ] `npm run lint` passes  
- [ ] Examples still work (if touched)  
- [ ] README/AGENTS updated (if relevant)  
- [ ] **Changelog file** added (see below)  

---

## Changelog entries

After **any change**, add a new file under `changelog/`:

```
changelog/YYYY-MM-DD-hhmm[am|pm]-short-desc.md
```

Template:

```md
# Change: <short description>

- Date: 2025-08-23 06:26 PM PT
- Author/Agent: <name or automation id>
- Scope: (lib | cli | examples | docs | tooling)
- Type: (feat | fix | docs | refactor | test | chore)
- Summary:
  - <bullet 1>
  - <bullet 2>

- Impact:
  - <public API?, behavior?, perf?, size?>

- Follow-ups:
  - <links to tasks or TODOs>
```

---

## Security & secret handling

- **Never** commit secrets (API keys, `onyx-database.json` with real credentials).
- Respect `.gitignore` for `examples/onyx/types.ts`, build outputs, and local configs.
- Error messages must not leak credentials or request headers.

---

## Release process

- Maintainers handle publishing; do not run `npm publish` in PRs.
- Ensure the `exports` map remains correct:
  - `.` → types/import/require for lib
  - `bin` → `dist/gen/cli/generate.cjs`

When bumping versions:
- Update `package.json` `version`.
- Ensure `dist/` builds cleanly and `index.d.ts` aligns with `src/types/public.ts`.
- Update `README.md` if features changed.

---

## Questions

- Docs: https://onyx.dev/documentation/
- Cloud console: https://cloud.onyx.dev
- API docs: https://onyx.dev/documentation/api-documentation/

Thanks for helping keep this SDK small, fast, and a joy to use. 🙌
```
::contentReference[oaicite:0]{index=0}
