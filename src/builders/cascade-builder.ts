// filename: src/builders/cascade-builder.ts
import type { ICascadeBuilder } from '../types/builders';
import type { IOnyxDatabase } from '../types/public';

/**
 * Standalone CascadeBuilder implementation that composes over the public IOnyxDatabase API.
 * This avoids private coupling while supporting:
 *   onyx.cascade('relA', 'relB').save('Table', {...})
 *   onyx.cascade('relA').delete('Table', 'primaryKey')
 */
export class CascadeBuilder<Schema = Record<string, unknown>> implements ICascadeBuilder<Schema> {
  private relationships: string[] = [];

  constructor(private readonly db: IOnyxDatabase<Schema>) {}

  cascade(...relationships: string[]): ICascadeBuilder<Schema> {
    this.relationships = relationships.flat();
    return this;
  }

  save<Table extends keyof Schema & string>(
    table: Table,
    entityOrEntities: Partial<Schema[Table]> | Array<Partial<Schema[Table]>>
  ): Promise<unknown> {
    const opts = this.relationships.length ? { relationships: this.relationships } : undefined;
    return this.db.save(
      table,
      entityOrEntities as Schema[Table] | Array<Schema[Table]>,
      opts,
    );
  }

  delete<Table extends keyof Schema & string>(
    table: Table,
    primaryKey: string,
  ): Promise<Schema[Table]> {
    const opts = this.relationships.length ? { relationships: this.relationships } : undefined;
    return this.db.delete(table, primaryKey, opts);
  }
}

export default CascadeBuilder;
