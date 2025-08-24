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
    private readonly db: IOnyxDatabase<Record<string, unknown>>,
    private readonly table: string
  ) {}

  cascade(...relationships: string[]): ISaveBuilder<T> {
    this.relationships = relationships.flat();
    return this;
  }

  one(entity: Partial<T>): Promise<unknown> {
    const opts = this.relationships.length ? { relationships: this.relationships } : undefined;
    return this.db.save(this.table, entity as Partial<unknown>, opts);
  }

  many(entities: Array<Partial<T>>): Promise<unknown> {
    const opts = this.relationships.length ? { relationships: this.relationships } : undefined;
    return this.db.save(this.table, entities as Array<Partial<unknown>>, opts);
  }
}

export default SaveBuilder;
