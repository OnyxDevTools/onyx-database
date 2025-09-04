# Change: add batchSave, stream helpers, and nullable findById

- Date: 2025-09-04 02:18 AM UTC
- Author/Agent: openai-dev
- Scope: lib
- Type: feat
- Summary:
  - support saving entities in batches via batchSave
  - add streamEventsOnly and streamWithQueryResults convenience methods
  - make findById return null on 404 responses
- Impact:
  - public API expanded; findById return type relaxed
- Follow-ups:
  - none
