# Change: cache config with TTL

- Date: 2025-08-24 01:34 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: feat
- Summary:
  - cache resolved credentials with a default 5 minute TTL
  - expose onyx.clearCacheConfig to reset the cache
  - document TTL option and caching behavior
- Impact:
  - public API added: OnyxConfig.ttl and onyx.clearCacheConfig
- Follow-ups:
  - none
