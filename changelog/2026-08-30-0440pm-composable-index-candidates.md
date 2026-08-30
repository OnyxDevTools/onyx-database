# Change: Compose bounded index candidates with AND filters

- Date: 2026-08-30 04:40 PM MT
- Author/Agent: Codex
- Scope: lib | docs | tests
- Type: feat
- Summary:
  - Allow one `CANDIDATES` condition in a recursively conjunctive query tree.
  - Preserve sole-root enforcement for `SEARCH_CANDIDATES` and `HNSW_CANDIDATES`.
  - Reject `OR` trees and duplicate index-candidate clauses before transport.

- Impact:
  - TypeScript callers use `.where(approximateCandidates(...)).and(...)`, the same condition-expression pattern as `eq`, `within`, and other operators.
  - The builder-level `.approximateCandidates(...)` method remains only as a deprecated compatibility shortcut.

- Follow-ups:
  - Release with a server version that supports post-admission `AND` filtering.
