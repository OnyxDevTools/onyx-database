# Change: Version the high-level search API release

- Date: 2026-08-29 09:24 PM MT
- Author/Agent: Codex
- Scope: lib | docs | tooling
- Type: chore
- Summary:
  - Bump `@onyx.dev/onyx-database` from 2.6.0 to 2.7.0 for the additive high-level search API.
  - Synchronize the root package lock, linked examples lock, generated SDK version documentation, and package changelog.
  - Refresh vulnerable development-tool lock entries and raise the Brotli bundle ceiling from 24 KB to 25 KB for the additive search contract.
  - Remove a duplicated type-only code-generator import rejected by the refreshed secure Vitest/Vite parser.
  - Leave the Changesets queue empty because this checkout is already versioned and ready for the tag-driven publish workflow.

- Impact:
  - The release artifact identifies itself as 2.7.0 and includes typed lexical, semantic, and hybrid search options without breaking legacy search calls; runtime dependencies remain empty.

- Follow-ups:
  - Create and push `v2.7.0` only after the compatible database and Cloud services are ready to deploy; publishing remains handled by the tag-triggered release workflow.
