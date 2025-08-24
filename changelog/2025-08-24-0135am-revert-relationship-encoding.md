# Change: revert relationship encoding fix

- Date: 2025-08-24 01:35 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Revert relationship encoding change that broke delete responses
- Impact:
  - Restores previous delete behavior; relationship paths may be double-encoded
- Follow-ups:
  - Investigate proper fix for encoding without breaking delete
