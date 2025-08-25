# Change: normalize stream actions

- Date: 2025-08-25 04:28 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Handle additional stream action names (`event` field and lowercase values`).
  - Map common synonyms to canonical actions so item handlers fire reliably.
- Impact:
  - Ensures streaming examples receive add/update/delete callbacks.
- Follow-ups:
  - None
