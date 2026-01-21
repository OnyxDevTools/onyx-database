// filename: src/helpers/aggregates.ts
export const avg = (attribute: string): string => `avg(${attribute})`;
export const sum = (attribute: string): string => `sum(${attribute})`;
export const count = (attribute: string): string => `count(${attribute})`;
export const min = (attribute: string): string => `min(${attribute})`;
export const max = (attribute: string): string => `max(${attribute})`;
export const std = (attribute: string): string => `std(${attribute})`;
export const variance = (attribute: string): string => `variance(${attribute})`;
export const median = (attribute: string): string => `median(${attribute})`;
export const upper = (attribute: string): string => `upper(${attribute})`;
export const lower = (attribute: string): string => `lower(${attribute})`;
export const substring = (attribute: string, from: number, length: number): string =>
  `substring(${attribute},${from},${length})`;
export const replace = (attribute: string, pattern: string, repl: string): string =>
  `replace(${attribute}, '${pattern.replace(/'/g, "\\'")}', '${repl.replace(/'/g, "\\'")}')`;
export const format = (attribute: string, formatter: string): string =>
  `format(${attribute}, '${formatter.replace(/'/g, "\\'")}')`;
export const percentile = (attribute: string, p: number): string => `percentile(${attribute}, ${p})`;
