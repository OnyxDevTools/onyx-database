# Change: build before running interop tests

- Date: 2025-08-24 12:50 AM PT
- Author/Agent: ChatGPT
- Scope: test
- Type: fix
- Summary:
  - build the package within interop tests to ensure dist modules exist

- Impact:
  - `npm test` succeeds without a prior build

- Follow-ups:
  - none
