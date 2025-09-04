# Change: return QueryResults from list()

- Date: 2025-09-03 06:33 PM PT
- Author/Agent: OpenAI Assistant
- Scope: lib
- Type: feat
- Summary:
  - list() now returns array-like QueryResults with nextPage metadata
  - exposed QueryResults type in public API and docs
- Impact:
  - public API updated; list() callers can access nextPage on results
- Follow-ups:
  - none
