// filename: src/types/common.ts
/**
 * Supported operators for building query criteria.
 *
 * @example
 * ```ts
 * const criteria = { field: 'age', operator: 'GREATER_THAN', value: 21 };
 * ```
 */
export type QueryCriteriaOperator =
  | 'EQUAL' | 'NOT_EQUAL' | 'IN' | 'NOT_IN'
  | 'GREATER_THAN' | 'GREATER_THAN_EQUAL'
  | 'LESS_THAN' | 'LESS_THAN_EQUAL'
  | 'MATCHES' | 'NOT_MATCHES'
  | 'BETWEEN' | 'NOT_BETWEEN'
  | 'LIKE' | 'NOT_LIKE'
  | 'CONTAINS' | 'CONTAINS_IGNORE_CASE'
  | 'NOT_CONTAINS' | 'NOT_CONTAINS_IGNORE_CASE'
  | 'STARTS_WITH' | 'NOT_STARTS_WITH'
  | 'IS_NULL' | 'NOT_NULL'
  /** High-level lexical, semantic, or hybrid search using server-managed search integration. */
  | 'SEARCH'
  /** Explicitly approximate, bounded admission from an ordinary secondary index. */
  | 'CANDIDATES'
  /** Explicitly approximate, bounded lexical admission from a searchable table. */
  | 'SEARCH_CANDIDATES'
  /** Explicitly approximate, bounded native-HNSW nearest-neighbor admission. */
  | 'HNSW_CANDIDATES';

/** Value payload for native vector-managed full-text searches. */
export interface FullTextQuery {
  queryText: string;
  minScore: number | null;
}

/** Search strategy used by the high-level {@link SearchOptions} API. */
export type SearchMode = 'lexical' | 'semantic' | 'hybrid';

/** Whether the lexical portion of a search may match any term or must match every term. */
export type SearchMatch = 'all' | 'any';

/** Options for natural-language lexical, semantic, or hybrid search. */
export interface SearchOptions {
  /** Search strategy. Defaults to `hybrid`. */
  mode?: SearchMode;
  /** Lexical term policy. Defaults to `any`. */
  match?: SearchMatch;
  /** Optional normalized minimum score threshold from 0 through 1. */
  minScore?: number | null;
  /** Maximum candidates considered. Defaults to 1,000; hybrid requires at least 2. */
  maxCandidates?: number;
}

/** Lossless signed 64-bit value accepted by native semantic search helpers. */
export type Int64WireInput = string | bigint | number;

/** Lossless semantic routing signature used by native vector-managed search. */
export interface SemanticVectorSignature {
  calibrationId: string;
  bucketId: number;
  cells: number[];
  cellCounts: number[];
  fingerprint: string[];
  bands: string[];
  boundaryConfidence: number;
}

/** Input accepted by {@link semanticVectorSignature}. */
export interface SemanticVectorSignatureInput {
  calibrationId: Int64WireInput;
  bucketId: number;
  cells: readonly number[];
  cellCounts: readonly number[];
  fingerprint: readonly Int64WireInput[];
  bands?: readonly Int64WireInput[];
  boundaryConfidence?: number;
}

/** Native lexical, semantic, or hybrid vector-managed search value. */
export interface VectorSearchQuery {
  text: string | null;
  semantic: SemanticVectorSignature | null;
  minScore: number | null;
  nearbyBucketRadius: number;
  maxCandidates: number;
  requireAllTerms: boolean;
}

/** Input accepted by {@link vectorSearchQuery}. */
export interface VectorSearchQueryInput {
  text?: string | null;
  semantic?: SemanticVectorSignatureInput | SemanticVectorSignature | null;
  minScore?: number | null;
  nearbyBucketRadius?: number;
  maxCandidates?: number;
  requireAllTerms?: boolean;
}

/** Lossless bounded native-HNSW candidate request. */
export interface HnswSearchQuery {
  calibrationId: string;
  vector: number[];
  maxCandidates: number;
  efSearch: number;
  minScore: number | null;
  formatVersion: 1;
}

/** Input accepted by {@link hnswSearchQuery}. */
export interface HnswSearchQueryInput {
  calibrationId: Int64WireInput;
  vector: readonly number[];
  maxCandidates?: number;
  efSearch?: number;
  minScore?: number | null;
  formatVersion?: number;
}

/** Bounded ordinary-index candidate route. */
export interface ApproximateIndexCandidateQuery {
  values: unknown[];
  maxCandidates: number;
}

/** Options for the text convenience overload of `approximateSearch`. */
export interface ApproximateSearchOptions {
  minScore?: number | null;
  maxCandidates?: number;
  requireAllTerms?: boolean;
}

/** Logical operator used to join conditions in a query. */
export type LogicalOperator = 'AND' | 'OR';

/**
 * Sorting instruction for query results.
 *
 * @property field - Field name to order by.
 * @property order - Sort direction.
 * @example
 * ```ts
 * const sort: Sort = { field: 'name', order: 'ASC' };
 * ```
 */
export interface Sort { field: string; order: 'ASC' | 'DESC' }

/** Actions emitted by real-time data streams. */
export type StreamAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'QUERY_RESPONSE' | 'KEEP_ALIVE';

/**
 * Basic document representation used by the SDK.
 *
 * @example
 * ```ts
 * const doc: OnyxDocument = { documentId: '1', content: 'hello' };
 * ```
 */
export interface OnyxDocument {
  /** Unique document identifier. */
  documentId?: string;
  /** Path within the Onyx database. */
  path?: string;
  /** Creation timestamp. */
  created?: Date;
  /** Last update timestamp. */
  updated?: Date;
  /** MIME type of the content. */
  mimeType?: string;
  /** Raw document content. */
  content?: string;
}

/** Minimal fetch typing to avoid DOM lib dependency */
export interface FetchResponse {
  /** Whether the request succeeded (status in the range 200–299). */
  ok: boolean;
  /** HTTP status code. */
  status: number;
  /** HTTP status text. */
  statusText: string;
  /** Response headers getter. */
  headers: { get(name: string): string | null };
  /** Reads the body as text. */
  text(): Promise<string>;
  /** Reads the body as bytes when the response uses a binary wire format. */
  arrayBuffer?(): Promise<ArrayBuffer>;
  /** Raw body for streams; left as unknown to avoid DOM typings */
  body?: unknown;
}

/**
 * Fetch implementation signature used by the SDK.
 *
 * @param url - Resource URL.
 * @param init - Optional init parameters.
 * @example
 * ```ts
 * const res = await fetchImpl('https://api.onyx.dev');
 * ```
 */
export type FetchImpl = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string | Uint8Array }
) => Promise<FetchResponse>;
