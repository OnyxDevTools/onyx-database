# Change: avoid env leakage in config cache tests

- Date: 2025-09-07 02:12 PM PT
- Author/Agent: ChatGPT
- Scope: test
- Type: fix
- Summary:
  - Replace environment-based setup in config cache tests with explicit configuration.
  - Prevents cross-test interference from global environment variables.
- Impact:
  - Ensures stable test runs without affecting runtime behavior.
- Follow-ups:
  - none
