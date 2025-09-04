# Change: allow chaining values() after list()

- Date: 2025-09-03 09:06 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - make list() return a promise with values() helper
  - enable db.from(...).where(...).list().values(field)
- Impact:
  - improves QueryResults ergonomics; no API break
- Follow-ups:
  - none

