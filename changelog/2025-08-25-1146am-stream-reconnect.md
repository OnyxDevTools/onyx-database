# Change: improve stream reconnection

- Date: 2025-08-25 11:46 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - reconnect JSON-lines stream when server closes the connection
  - ensure clients continue polling for new events
- Impact:
  maintains long-lived stream subscriptions without manual restarts
- Follow-ups:
  none
