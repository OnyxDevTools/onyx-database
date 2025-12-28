# Change: Align secrets client naming and date typing

- Date: 2025-12-28 08:50 PM UTC
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - rename the secrets save helper to `putSecret` and request type to `SecretSaveRequest`
  - normalize secret metadata timestamps to `Date` instances and update the public type
  - refresh README guidance and tests for the renamed helper

- Impact:
  - public API change for the secrets save helper name; `updatedAt` now yields `Date` objects

- Follow-ups:
  - none
