# Change: allow home profile when env missing id

- Date: 2025-08-24 12:55 PM PT
- Author/Agent: openai
- Scope: lib
- Type: fix
- Summary:
  - read project/home config when env lacks database id
  - pass env database id to file lookups
- Impact:
  - ensures ~/.onyx/onyx-database.json is used when only API credentials are in env
- Follow-ups:
  - none
