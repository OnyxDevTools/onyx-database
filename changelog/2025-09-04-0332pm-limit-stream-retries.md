# Change: cap stream retries at four

- Date: 2025-09-04 03:32 PM PT
- Author/Agent: openai-agent
- Scope: lib
- Type: fix
- Summary:
  - limit stream reconnection attempts to four before giving up
- Impact:
  - prevents infinite reconnect loops when streams continuously fail
- Follow-ups:
  - none
