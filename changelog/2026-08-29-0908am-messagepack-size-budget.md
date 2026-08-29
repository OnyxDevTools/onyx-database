# Change: update the SDK bundle-size ceiling

- Date: 2026-08-29 09:08 AM MT
- Author/Agent: Codex
- Scope: tooling, docs
- Type: chore
- Summary:
  - raise the Brotli bundle ceiling from the stale 12 kB value to 21 kB
  - record a clean-HEAD baseline of 17,252 bytes and a MessagePack-enabled size of 20,789 bytes

- Impact:
  - restores the release size check with 211 bytes of explicit headroom
  - the binary entity transport increases the measured Brotli entry size by 3,537 bytes (20.5%)

- Follow-ups:
  - treat future increases beyond 21 kB as regressions requiring investigation or another documented review
