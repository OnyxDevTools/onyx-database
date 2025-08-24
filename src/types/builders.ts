// filename: src/types/builders.ts
import type { Sort, StreamAction } from './common';
import type { QueryCondition, QueryCriteria } from './protocol';

export interface IConditionBuilder {
  and(condition: IConditionBuilder | QueryCriteria): IConditionBuilder;
  or(condition: IConditionBuilder | QueryCriteria): IConditionBuilder;
  toCondition(): QueryCondition;
}

export interface IQueryBuilder<T = unknown> {
  from(table: string): IQueryBuilder<T>;
  selectFields(fields: string[]): IQueryBuilder<T>;
  resolve(values: string[] | string): IQueryBuilder<T>;
  where(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T>;
  and(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T>;
  or(condition: IConditionBuilder | QueryCriteria): IQueryBuilder<T>;
  orderBy(...sorts: Sort[]): IQueryBuilder<T>;
  groupBy(...fields: string[]): IQueryBuilder<T>;
  distinct(): IQueryBuilder<T>;
  limit(n: number): IQueryBuilder<T>;
  inPartition(partition: string): IQueryBuilder<T>;

  pageSize(n: number): IQueryBuilder<T>;
  nextPage(token: string): IQueryBuilder<T>;

  count(): Promise<number>;
  list(options?: { pageSize?: number; nextPage?: string }): Promise<T[]>;
  firstOrNull(): Promise<T | null>;
  one(): Promise<T | null>;
  page(options?: { pageSize?: number; nextPage?: string }): Promise<{ records: T[]; nextPage?: string | null }>;

  setUpdates(updates: Partial<T>): IQueryBuilder<T>;
  update(): Promise<unknown>;
  delete(): Promise<unknown>;

  onItemAdded(listener: (entity: T) => void): IQueryBuilder<T>;
  onItemUpdated(listener: (entity: T) => void): IQueryBuilder<T>;
  onItemDeleted(listener: (entity: T) => void): IQueryBuilder<T>;
  onItem(listener: (entity: T | null, action: StreamAction) => void): IQueryBuilder<T>;
  stream(includeQueryResults?: boolean, keepAlive?: boolean): Promise<{ cancel: () => void }>;
}

export interface ISaveBuilder<T = unknown> {
  cascade(...relationships: string[]): ISaveBuilder<T>;
  one(entity: Partial<T>): Promise<unknown>;
  many(entities: Array<Partial<T>>): Promise<unknown>;
}

export interface ICascadeBuilder<Schema = Record<string, unknown>> {
  cascade(...relationships: string[]): ICascadeBuilder<Schema>;
  save<Table extends keyof Schema & string>(
    table: Table,
    entityOrEntities: Partial<Schema[Table]> | Array<Partial<Schema[Table]>>
  ): Promise<unknown>;
  delete<Table extends keyof Schema & string>(
    table: Table,
    primaryKey: string,
  ): Promise<Schema[Table]>;
}
export interface ICascadeRelationshipBuilder {
  graph(name: string): ICascadeRelationshipBuilder;
  graphType(type: string): ICascadeRelationshipBuilder;
  targetField(field: string): ICascadeRelationshipBuilder;
  sourceField(field: string): string;
}
