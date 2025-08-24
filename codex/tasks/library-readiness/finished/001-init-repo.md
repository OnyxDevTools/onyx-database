# Task: Initialize TypeScript library repo

## Goal
Create a clean, minimal repo scaffold for an open-source TypeScript library.

## Steps
1. Initialize git and npm:
   - `git init`
   - `npm init -y`
2. Add baseline directories: `src/`, `tests/`, `.github/`, `.vscode/`.
3. Create `src/index.ts` with a trivial exported function.
4. Add `.gitignore` for node, build artifacts, coverage, logs.
5. Add `README.md` with project name, brief description, and quickstart section.

## Acceptance Criteria
- Running `git status` shows tracked baseline files and folders.
- `src/index.ts` exports at least one named function.
- `.gitignore` excludes `node_modules`, `dist`, `coverage`, and `*.log`.
- `README.md` contains Installation and Quickstart sections.
