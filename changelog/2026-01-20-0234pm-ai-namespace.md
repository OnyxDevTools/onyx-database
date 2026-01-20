# Change: add ai namespace for Onyx AI

- Date: 2026-01-20 02:34 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: feat
- Summary:
  - Add `db.ai` namespace that wraps chat completions, models, and script approvals.
  - Keep legacy AI helpers but mark them deprecated in the public types.
  - Update AI examples and README to point to the new entrypoint.

- Impact:
  New public surface area; existing `db.chat()/db.getModel()` aliases remain for backward compatibility.

- Follow-ups:
  None.
