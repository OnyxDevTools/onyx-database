# Change: expose Schema as value for easier imports

- Date: 2025-08-24 02:54 AM PT
- Author/Agent: OpenAI Assistant
- Scope: gen | examples | docs
- Type: fix
- Summary:
  - export a runtime `Schema` constant from generated types
  - drop `type` qualifier in example imports
  - document new import style
- Impact:
  - enables `import { Schema }` without TypeScript type-only syntax
- Follow-ups:
  - none
