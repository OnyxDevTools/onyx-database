# Change: Strip entityText from schema payloads

- Date: 2026-01-03 03:33 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - drop entityText before publish/validate schema requests and normalize responses to omit it
  - sanitize schema fetch/history outputs and cover entityText removal with tests
  - keep schema CLI flows aligned by relying on the sanitized SDK payloads

- Impact:
  Removes entityText from schema requests/responses; public API unchanged.

- Follow-ups:
  None.
