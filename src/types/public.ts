// filename: src/types/public.ts
import type { OnyxDocument, FetchImpl } from './common';
import type { IQueryBuilder, ICascadeBuilder, ISaveBuilder } from './builders';

export interface OnyxConfig {
  baseUrl?: string;
  databaseId?: string;
  apiKey?: string;
  apiSecret?: string;
  fetch?: FetchImpl;
}

export interface IOnyxDatabase<Schema = Record<string, unknown>> {
  from<Table extends keyof Schema & string>(table: Table): IQueryBuilder<Schema[Table]>;
  select(...fields: string[]): IQueryBuilder<Record<string, unknown>>;
  cascade(...relationships: string[]): ICascadeBuilder<Schema>;

  save<Table extends keyof Schema & string>(table: Table): ISaveBuilder<Schema[Table]>;
  save<Table extends keyof Schema & string>(
    table: Table,
    entityOrEntities: Partial<Schema[Table]> | Array<Partial<Schema[Table]>>,
    options?: { relationships?: string[] }
  ): Promise<unknown>;

  findById<Table extends keyof Schema & string, T = Schema[Table]>(
    table: Table,
    primaryKey: string,
    options?: { partition?: string; resolvers?: string[] }
  ): Promise<T>;

  delete(
    table: string,
    primaryKey: string,
    options?: { partition?: string; relationships?: string[] }
  ): Promise<unknown>;

  saveDocument(doc: OnyxDocument): Promise<unknown>;
  getDocument(documentId: string, options?: { width?: number; height?: number }): Promise<unknown>;
  deleteDocument(documentId: string): Promise<unknown>;

  /** Cancels active streams; safe to call multiple times */
  close(): void;
}

export interface OnyxFacade {
  init<Schema = Record<string, unknown>>(config?: OnyxConfig): IOnyxDatabase<Schema>;
}

export * from './common';
export * from './protocol';
export * from './builders';