# Change: wait for stream before saves

- Date: 2025-08-25 05:56 PM UTC
- Author/Agent: ChatGPT
- Scope: examples
- Type: fix
- Summary:
  - start streaming example only after the stream handle resolves
  - ensures subsequent saves occur after listeners are active
- Impact:
  - stream example reliably emits query and mutation events
- Follow-ups:
  - none
