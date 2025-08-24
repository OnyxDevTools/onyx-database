# Change: document connection handling in init()

- Date: 2025-08-24 12:44 PM PT
- Author/Agent: ChatGPT
- Scope: docs
- Type: docs
- Summary:
  - explain that `onyx.init()` creates a lightweight client with an internal HttpClient
  - note that Node's `fetch` already provides keep-alive and connection pooling

- Impact:
  - clarifies connection reuse; no API changes

- Follow-ups:
  - none

