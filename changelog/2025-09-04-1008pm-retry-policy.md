# Change: refine retry policy

- Date: 2025-09-04 10:08 PM UTC
- Author/Agent: AI
- Scope: lib
- Type: refactor
- Summary:
  - limit retries to GET and read query requests
  - apply exponential backoff strategy
  - skip retries for create, update, save, and delete operations
- Impact:
  public API unchanged, behavior adjusted for reliability
- Follow-ups:
  none
