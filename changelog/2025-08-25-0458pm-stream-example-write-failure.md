# Change: handle write failures in stream example

- Date: 2025-08-25 04:58 PM PT
- Author/Agent: ChatGPT
- Scope: examples
- Type: fix
- Summary:
  - wrap stream writes in try/catch to cancel on error
- Impact:
  - stream example exits gracefully when writes fail
- Follow-ups:
  - none
