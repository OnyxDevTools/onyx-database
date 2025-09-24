# Change: ensure QueryResults.forEach iterates all pages

- Date: 2025-09-23 06:00 PM PT
- Author/Agent: ChatGPT
- Scope: lib
- Type: fix
- Summary:
  - Route QueryResults.forEach through forEachAll so callbacks see every remote page.
  - Support optional thisArg binding and promise callbacks for QueryResults.forEach.
  - Extend tests to cover QueryResultsPromise.forEach behavior and early termination.
- Impact:
  - Behavior change: QueryResults.forEach now fetches additional pages automatically.
- Follow-ups:
  - None
