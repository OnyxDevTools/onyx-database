// filename: src/index.ts
export const sdkName = '@onyx.dev/onyx-database';
export const sdkVersion = '0.1.0';

// Public types & contracts
export * from './types/public';

// client impl
export { onyx } from './impl/onyx';

// Helpers (make these available at top-level)
export * from './helpers/sort';        // asc, desc
export * from './helpers/conditions';  // eq, neq, inOp, ...
export * from './helpers/aggregates';  // avg, sum, count, ...
