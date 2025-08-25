// filename: src/builders/cascade-builder.ts
import type { ICascadeBuilder } from '../types/builders';
import type { IOnyxDatabase } from '../types/public';

/**
 * Standalone CascadeBuilder implementation that composes over the public IOnyxDatabase API.
 * This avoids private coupling while supporting:
 *   onyx.cascade('relA:RelType(target, source)').save('Table', {...})
 *   onyx.cascade('relB').delete('Table', 'primaryKey')
 *   const rel = onyx
 *     .cascadeBuilder()
 *     .graph('relA')
 *     .graphType('RelType')
 *     .targetField('target')
 *     .sourceField('source');
 *   onyx.cascade(rel).save('Table', {...})
 */
export class CascadeBuilder<Schema = Record<string, unknown>> implements ICascadeBuilder<Schema> {
  private relationships: string[] = [];

  /**
   * Create a builder bound to the provided database facade.
   *
   * @param db Instance of the Onyx database facade.
   * @example
   * ```ts
   * const builder = new CascadeBuilder(onyx);
   * ```
   */
  constructor(private readonly db: IOnyxDatabase<Schema>) {}

  /**
   * Specify relationships that should be cascaded during save or delete.
   *
   * @param relationships Relationship names for deletes or cascade strings for saves.
   * @example
   * ```ts
   * // Cascading delete via resolver attribute names
   * builder.cascade('orders').delete('User', '1');
   * ```
   * @example
   * ```ts
   * // Cascading save using cascade string syntax
   * builder.cascade('orders:Order(userId, id)').save('User', { id: '1' });
   * ```
   * @example
   * ```ts
   * // Cascading save using the builder pattern
   * const rel = onyx
   *   .cascadeBuilder()
   *   .graph('orders')
   *   .graphType('Order')
   *   .targetField('userId')
   *   .sourceField('id');
   * builder.cascade(rel).save('User', { id: '1' });
   * ```
   */
  cascade(...relationships: string[]): ICascadeBuilder<Schema> {
    this.relationships = relationships.flat();
    return this;
  }

  /**
   * Persist one or more entities to the target table.
   *
   * @param table Target table name.
   * @param entityOrEntities Entity or entities to persist.
   * @example
   * ```ts
   * await builder.save('Users', { id: '1', name: 'Ada' });
   * await builder.save('Users', [{ id: '2' }, { id: '3' }]);
   * // with cascade relationships
   * await builder
   *   .cascade('roles:Role(userId, id)')
   *   .save('Users', { id: '4', name: 'Eve', roles: [] });
   * ```
   */
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

  /**
   * Delete an entity by primary key from the given table.
   *
   * @param table Target table name.
   * @param primaryKey Primary key of the entity to delete.
   * @example
   * ```ts
   * await builder.delete('Users', '1');
   * // with cascade
   * await builder.cascade('orders').delete('Users', '2');
   * ```
   */
  delete<Table extends keyof Schema & string>(
    table: Table,
    primaryKey: string,
  ): Promise<Schema[Table]> {
    const opts = this.relationships.length ? { relationships: this.relationships } : undefined;
    return this.db.delete(table, primaryKey, opts);
  }
}

export default CascadeBuilder;
