# Change: broaden stream action detection

- Date: 2025-08-25 06:03 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - recognize additional action field names when processing stream events
  - handle extra synonyms for creation events (INSERT, CREATED)
- Impact:
  - ensures stream callbacks fire for add, update, and delete events
- Follow-ups:
  - none
