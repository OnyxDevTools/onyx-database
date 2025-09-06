# Change: tolerate stray newlines in config profiles

- Date: 2025-09-06 05:53 AM UTC
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - sanitize JSON config files before parsing to strip newline characters
  - add regression test for newline handling in profile values
- Impact:
  - prevents config parsing failures when values contain leading newlines
- Follow-ups:
  - none
