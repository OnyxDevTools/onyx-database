// filename: src/types/common.ts
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

export type LogicalOperator = 'AND' | 'OR';

export type Sort = { field: string; order: 'ASC' | 'DESC' };

export type StreamAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'QUERY_RESPONSE' | 'KEEP_ALIVE';

export type OnyxDocument = {
  documentId?: string;
  path?: string;
  created?: Date;
  updated?: Date;
  mimeType?: string;
  content?: string;
};

/** Minimal fetch typing to avoid DOM lib dependency */
export interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  /** raw body for streams; left as unknown to avoid DOM typings */
  body?: unknown;
}
export type FetchImpl = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<FetchResponse>;