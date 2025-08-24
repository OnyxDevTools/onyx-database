# Change: require config object for init

- Date: 2025-08-24 01:00 PM PT
- Author/Agent: ChatGPT
- Scope: lib | docs
- Type: refactor
- Summary:
  - enforce `onyx.init` to accept only `OnyxConfig`
  - update documentation examples to pass `{ databaseId }`
- Impact:
  - public API change; raw database ID strings are no longer accepted
- Follow-ups:
  - none
