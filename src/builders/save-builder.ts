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

  /**
   * Create a builder bound to a specific table.
   *
   * @param db Onyx database facade.
   * @param table Table name to save into.
   * @example
   * ```ts
   * const saver = new SaveBuilder(db, 'Users');
   * ```
   */
  constructor(
    private readonly db: IOnyxDatabase<Record<string, unknown>>,
    private readonly table: string
  ) {}

  /**
   * Specify relationships to cascade during save.
   *
   * @param relationships Cascade strings like `field:Type(target, source)` or
   * relationship names when using resolver defaults.
   * @example
   * ```ts
   * // object format
   * saver.cascade('orders:Order(userId, id)');
   * ```
   * @example
   * ```ts
   * // builder pattern
   * const rel = db
   *   .cascadeBuilder()
   *   .graph('orders')
   *   .graphType('Order')
   *   .targetField('userId')
   *   .sourceField('id');
   * saver.cascade(rel);
   * ```
   */
  cascade(...relationships: string[]): ISaveBuilder<T> {
    this.relationships = relationships.flat();
    return this;
  }

  /**
   * Persist a single entity.
   *
   * @param entity Entity data to persist.
   * @example
   * ```ts
   * await saver.one({ id: '1', name: 'Ada' });
   * ```
   */
  one(entity: Partial<T>): Promise<unknown> {
    const opts = this.relationships.length
      ? { relationships: this.relationships }
      : undefined;
    return this.db.save(this.table, entity as Partial<unknown>, opts);
  }

  /**
   * Persist multiple entities.
   *
   * @param entities Array of entity data to persist.
   * @example
   * ```ts
   * await saver.many([{ id: '1' }, { id: '2' }]);
   * ```
   */
  many(entities: Array<Partial<T>>): Promise<unknown> {
    const opts = this.relationships.length
      ? { relationships: this.relationships }
      : undefined;
    return this.db.save(this.table, entities as Array<Partial<unknown>>, opts);
  }
}

export default SaveBuilder;
