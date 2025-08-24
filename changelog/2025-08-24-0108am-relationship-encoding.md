# Change: fix relationship encoding on save/delete

- Date: 2025-08-24 01:08 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Avoid double encoding the `relationships` query parameter for save and delete operations.
  - Allows delete to return the removed entity when cascading relationships.
- Impact:
  - Cascaded save and delete calls now send correct relationship values and receive expected bodies.
- Follow-ups:
  - none
