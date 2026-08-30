import type { SearchMatch, SearchMode, SearchOptions } from '../types/common';

const SEARCH_MODES = new Set<SearchMode>(['lexical', 'semantic', 'hybrid']);
const SEARCH_MATCHES = new Set<SearchMatch>(['all', 'any']);
const SEARCH_OPTION_KEYS = new Set(['mode', 'match', 'minScore', 'maxCandidates']);

export interface SearchCriteriaValue {
  text: string;
  mode: SearchMode;
  match: SearchMatch;
  minScore: number | null;
  maxCandidates: number;
}

/** Validate and canonicalize the high-level search wire value. */
export function searchCriteriaValue(text: string, options: SearchOptions): SearchCriteriaValue {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new TypeError('search text must be non-blank');
  }
  if (
    options === null ||
    typeof options !== 'object' ||
    Array.isArray(options) ||
    Object.getPrototypeOf(options) !== Object.prototype
  ) {
    throw new TypeError('search options must be a plain object');
  }
  const unknownKey = Object.keys(options).find(key => !SEARCH_OPTION_KEYS.has(key));
  if (unknownKey !== undefined) {
    throw new TypeError(`unsupported search option: ${unknownKey}`);
  }
  for (const key of ['mode', 'match', 'maxCandidates'] as const) {
    if (Object.prototype.hasOwnProperty.call(options, key) && options[key] === null) {
      throw new TypeError(`search ${key} cannot be null`);
    }
  }
  const mode = options.mode ?? 'hybrid';
  if (!SEARCH_MODES.has(mode)) {
    throw new TypeError('search mode must be lexical, semantic, or hybrid');
  }

  const match = options.match ?? 'any';
  if (!SEARCH_MATCHES.has(match)) {
    throw new TypeError('search match must be all or any');
  }

  const minScore = options.minScore ?? null;
  if (minScore !== null && (!Number.isFinite(minScore) || minScore < 0 || minScore > 1)) {
    throw new RangeError('search minScore must be a finite number between 0 and 1');
  }

  const maxCandidates = options.maxCandidates ?? 1_000;
  const minCandidates = mode === 'hybrid' ? 2 : 1;
  if (
    !Number.isInteger(maxCandidates) ||
    maxCandidates < minCandidates ||
    maxCandidates > 5_000
  ) {
    throw new RangeError(
      `search maxCandidates must be an integer between ${minCandidates} and 5000 for ${mode} mode`,
    );
  }

  return { text, mode, match, minScore, maxCandidates };
}
