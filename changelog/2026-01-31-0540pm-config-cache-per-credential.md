# Change: Cache config per credential pair

- Date: 2026-01-31 05:40 PM PT
- Author/Agent: Codex
- Scope: lib
- Type: fix
- Summary:
  - Switched config cache to a map keyed by `${databaseId}-${apiKey}` so different databases keep separate cached configs.
  - Retains TTL behavior and removes manual `clearCacheConfig()` requirement when swapping credentials.

- Impact:
  - Behavior change: config caching is now per-credential; multiple DBs can coexist without cache collisions.

- Follow-ups:
  - None.
