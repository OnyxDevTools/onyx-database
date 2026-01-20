# Task 001: AI shorthand parity across SDKs

## Task
Bring other Onyx SDKs in line with the TypeScript SDK changes from this session:
add the `ai` namespace (chat, models, script approvals), keep `db.chat()`/`db.chat('...')` supported,
introduce shorthand `db.chat('content', options?)` that defaults to the configured model and returns
the first message content by default, and ensure all environment variables use the `ONYX_` prefix.

## Plan
1. Audit each target SDK for current AI endpoints, config resolution, and env var naming.
2. Add/align the `ai` namespace API surface (chat/models/approvals) without deprecating existing entrypoints.
3. Implement shorthand `chat(content, options?)` with defaults:
   - `model` from config `defaultModel` (fallback `onyx`)
   - `role` defaults to `user`
   - `stream` defaults to `false`
   - return first message content when not streaming
4. Add `raw` option to return full completion response; keep streaming returning the stream/iterator.
5. Add config and env support for `defaultModel` (`ONYX_DEFAULT_MODEL`), ensure all env vars are `ONYX_*`.
6. Update docs and examples to show `db.ai` usage, shorthand calls, and env variable list.
7. Add/adjust tests to cover shorthand response shape, `raw`/`stream` behavior, and default model handling.
8. Run SDK-specific checks (typecheck/build/tests) and update changelogs.

## Acceptance Criteria
- [ ] Each SDK exposes `ai` namespace helpers for chat, models, and script approvals, with existing entrypoints still supported.
- [ ] `chat('content', options?)` returns first message content by default; `raw: true` returns full response; `stream: true` returns the stream.
- [ ] `defaultModel` config and `ONYX_DEFAULT_MODEL` env var are supported, with default model `onyx`.
- [ ] All documented environment variables use the `ONYX_` prefix and docs/examples reflect the new APIs.
- [ ] Tests and SDK checks pass with added coverage for shorthand behavior.
