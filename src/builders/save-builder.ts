// filename: src/builders/save-builder.ts
import type { ISaveBuilder } from '../types/builders';
import type { IOnyxDatabase } from '../types/public';

/**
 * SaveBuilder composes over the public IOnyxDatabase API to provide a builder
 * that supports:
 *   db.save('Table').cascade('relA', 'relB').one(entity)
 *   db.save('Table').many([entity1, entity2])
 */
export class SaveBuilder<T = unknown> implements ISaveBuilder<T> {
  private relationships: string[] = [];

  constructor(
    private readonly db: IOnyxDatabase<any>,
    private readonly table: string
  ) {}

  cascade(...relationships: string[]): ISaveBuilder<T> {
    this.relationships = relationships.flat();
    return this;
  }

  one(entity: Partial<T>): Promise<unknown> {
    const opts = this.relationships.length ? { relationships: this.relationships } : undefined;
    return this.db.save(this.table as any, entity as any, opts);
  }

  many(entities: Array<Partial<T>>): Promise<unknown> {
    const opts = this.relationships.length ? { relationships: this.relationships } : undefined;
    return this.db.save(this.table as any, entities as any, opts);
  }
}

export default SaveBuilder;
