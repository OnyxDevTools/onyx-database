# Change: support non-iterable records in QueryResults

- Date: 2025-09-09 10:10 AM PT
- Author/Agent: openai
- Scope: lib
- Type: fix
- Summary:
  - allow QueryResults to accept arrays, iterables, or single records
  - prevent spread syntax errors on non-iterable input
- Impact:
  - improves robustness; no API break
- Follow-ups:
  - none
