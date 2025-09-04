# Change: expose raw HTTP error body

- Date: 2025-09-07 09:15 AM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Add `rawBody` to `OnyxHttpError` for visibility into server responses.
  - Populate `rawBody` in HTTP client and streaming error paths.
- Impact:
  - Easier debugging by displaying full response text on errors.
- Follow-ups:
  - None
