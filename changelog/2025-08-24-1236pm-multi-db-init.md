# Change: support multiple database connections via init

- Date: 2025-08-24 12:36 PM PT
- Author/Agent: GPT-4o
- Scope: lib
- Type: feat
- Summary:
  - allow specifying database id in `onyx.init(dbId)`
  - resolve env credentials only when `ONYX_DATABASE_ID` matches
  - search project then home paths for database profiles
- Impact:
  - public API expands initialization options
- Follow-ups:
  - none
