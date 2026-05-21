# Task: Add Query Terminal Formatters

## Original Task

Add terminal formatter methods to the Onyx Database SDK query builder:

- `.table(options?)`
- `.tree(options?)`
- `.csv(options?)`
- `.json(options?)`

Each formatter must execute the query and return `Promise<string>`. The returned
string should be printable directly to the console. Add examples in
`examples/query` and include them in `scripts/run-examples.sh`.

## Plan

1. Add additive formatter option types and formatter terminal methods to the public query builder contract.
2. Implement shared zero-dependency formatters for table, tree, csv, and json output.
3. Wire both query builder implementations to execute the existing select query path and return `Promise<string>`.
4. Add tests for nested data, null handling, escaping, empty results, and no-regression behavior.
5. Add query formatter examples, update the README, and include the examples in the shared runner.

## Acceptance Criteria

- [x] `.table()`, `.tree()`, `.csv()`, and `.json()` exist as terminal query methods.
- [x] Each method executes the query.
- [x] Each method returns `Promise<string>`.
- [x] Returned strings can be printed directly using `console.log(...)`.
- [x] `.csv()` supports `headers: false`.
- [x] `.csv()` correctly escapes commas, quotes, and newlines.
- [x] `.csv()` flattens nested objects by default using dot notation.
- [x] `.json()` preserves nested objects.
- [x] `.table()` renders nested objects in readable inline form by default.
- [x] `.tree()` renders nested objects hierarchically.
- [x] Empty result sets return a valid empty representation for each format.
- [x] Null and undefined values are handled consistently using formatter options.
- [x] Existing query behavior and `.list()` behavior are not changed.
- [x] Added examples in `examples/query`.
- [x] Added the new examples to `scripts/run-examples.sh`.

## Validation

- [x] `npm test`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `bash scripts/run-examples.sh`
