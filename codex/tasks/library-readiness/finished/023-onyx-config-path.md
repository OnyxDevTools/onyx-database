# Support ONYX_CONFIG_PATH env var

Add support for a new environment variable `ONYX_CONFIG_PATH` that points to a JSON file containing Onyx credentials. When this env var is set, the resolver should load credentials only from that file (relative or absolute path) and ignore other environment variables or config file locations.

## Plan
1. Update `src/config/chain.ts` to read `ONYX_CONFIG_PATH` and load credentials only from that file when set.
2. Ensure relative paths resolve from `process.cwd()` and absolute paths work directly.
3. Skip reading other env vars and default config files when `ONYX_CONFIG_PATH` is present.
4. Add unit tests covering path resolution and env var precedence.
5. Document `ONYX_CONFIG_PATH` in `README.md` and `docs/README.md`.
6. Add changelog entry and commit task to codex/finished.

## Acceptance Criteria
- [x] Credentials are loaded from the path specified by `ONYX_CONFIG_PATH`.
- [x] Relative paths resolve from the current working directory.
- [x] When `ONYX_CONFIG_PATH` is set, standard env vars like `ONYX_DATABASE_API_KEY` are ignored.
- [x] Documentation and tests cover the new behavior.
