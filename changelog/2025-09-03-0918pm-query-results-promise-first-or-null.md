# Change: expose QueryResults helpers on QueryResultsPromise

- Date: 2025-09-03 09:18 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: feat
- Summary:
  - allow QueryResultsPromise to call all QueryResults helper methods directly
- Impact:
  - enables chaining helpers like `size()` or `firstOrNull()` before awaiting
- Follow-ups:
  - none
