# Change: make databaseId optional in config resolution and api codegen

- Date: 2026-03-03 05:28 PM PT
- Author/Agent: Codex (GPT-5)
- Scope: lib | cli | docs | test
- Type: fix
- Summary:
  - stop treating `databaseId` as required during Node and edge config resolution
  - allow `onyx-gen --source api` to proceed without an explicit `databaseId`
  - clarify docs so `ONYX_DATABASE_ID` and config-file `databaseId` are documented as optional

- Impact:
  - behavior change: callers can initialize with API key/secret and no `databaseId`
  - no public type-breaking API changes

- Follow-ups:
  - none
