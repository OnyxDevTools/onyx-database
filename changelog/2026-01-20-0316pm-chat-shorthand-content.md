# Change: chat shorthand returns content by default

- Date: 2026-01-20 03:16 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - Shorthand `db.chat('...')`/`db.ai.chat('...')` now returns the first message content by default.
  - Added `raw` option to receive the full completion response; streaming continues to return the stream.
  - Updated docs and shorthand example to reflect new return behavior.

- Impact:
  Behavioral change for shorthand chat calls; use `raw: true` for the previous response shape.

- Follow-ups:
  None.
