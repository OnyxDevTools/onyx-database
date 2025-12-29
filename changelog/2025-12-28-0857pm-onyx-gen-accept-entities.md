# Change: allow onyx-gen to read schema entities format

- Date: 2025-12-28 08:57 PM PT
- Author/Agent: Codex
- Scope: cli
- Type: fix
- Summary:
  - normalize schema inputs with `entities` (SchemaUpsertRequest shape) to the legacy `tables` introspection format
  - map numeric data types (Float/Double/Long/etc.) to number during type emission
  - add test covering entities-to-introspection normalization
- Impact:
  - bootstrap/codegen no longer fails when the schema file is fetched from the schema API
- Follow-ups:
  - none
