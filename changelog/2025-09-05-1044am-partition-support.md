# Change: add partition defaults and save support

- Date: 2025-09-05 10:44 AM PT
- Author/Agent: GPT-4o
- Scope: lib
- Type: feat
- Summary:
  - allow specifying partitions on save operations and builders
  - support default partition via `onyx.init({ partition })`
  - ensure docs and tests cover partition usage
- Impact:
  - adds optional `partition` to config and save methods
- Follow-ups:
  - none
