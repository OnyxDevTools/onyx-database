# Change: stub env vars in config-chain tests

- Date: 2025-09-07 02:33 PM PT
- Author/Agent: OpenAI ChatGPT
- Scope: test
- Type: fix
- Summary:
  - replace manual environment mutations with vi.stubEnv for better isolation
  - avoid cross-test interference by restoring env after each run
- Impact:
  - stabilizes config resolution test behavior; no runtime effect
- Follow-ups:
  - none
