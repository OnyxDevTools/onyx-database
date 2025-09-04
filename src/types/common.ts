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
  | 'BETWEEN'
  | 'LIKE' | 'NOT_LIKE'
  | 'CONTAINS' | 'CONTAINS_IGNORE_CASE'
  | 'NOT_CONTAINS' | 'NOT_CONTAINS_IGNORE_CASE'
  | 'STARTS_WITH' | 'NOT_STARTS_WITH'
  | 'IS_NULL' | 'NOT_NULL';

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
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<FetchResponse>;