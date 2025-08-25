# Change: prevent stream example from hanging

- Date: 2025-08-25 01:17 AM PT
- Author/Agent: ChatGPT
- Scope: examples
- Type: fix
- Summary:
  - start stream without awaiting to allow writes to run concurrently
- Impact:
  - ensures stream example emits events immediately
- Follow-ups:
  - none
