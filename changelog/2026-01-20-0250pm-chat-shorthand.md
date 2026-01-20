# Change: add shorthand chat call with default model

- Date: 2026-01-20 02:50 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: feat
- Summary:
  - Allow `db.chat('content', options?)` and `db.ai.chat('content', options?)` with sensible defaults.
  - Add `defaultModel` config (defaults to `onyx`, env overridable via `ONYX_DEFAULT_MODEL`).
  - Document shorthand usage and options in README.

- Impact:
  Backward-compatible additive API; existing chat client calls continue to work.

- Follow-ups:
  None.
