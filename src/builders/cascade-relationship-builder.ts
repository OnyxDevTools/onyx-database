// filename: src/builders/cascade-relationship-builder.ts
import type { ICascadeRelationshipBuilder } from '../types/builders';

/**
 * Builder for constructing cascade relationship strings like
 * `programs:StreamingProgram(channelId, id)`.
 */
export class CascadeRelationshipBuilder implements ICascadeRelationshipBuilder {
  private graphName?: string;
  private typeName?: string;
  private target?: string;

  /**
   * Set the graph name component.
   *
   * @param name Graph name or namespace.
   * @example
   * ```ts
   * builder.graph('programs');
   * ```
   */
  graph(name: string): ICascadeRelationshipBuilder {
    this.graphName = name;
    return this;
  }

  /**
   * Set the graph type component.
   *
   * @param type Graph type to target.
   * @example
   * ```ts
   * builder.graphType('StreamingProgram');
   * ```
   */
  graphType(type: string): ICascadeRelationshipBuilder {
    this.typeName = type;
    return this;
  }

  /**
   * Set the target field for the relationship.
   *
   * @param field Target field name.
   * @example
   * ```ts
   * builder.targetField('channelId');
   * ```
   */
  targetField(field: string): ICascadeRelationshipBuilder {
    this.target = field;
    return this;
  }

  /**
   * Produce the cascade relationship string using the provided source field.
   *
   * @param field Source field name.
   * @example
   * ```ts
   * const rel = builder
   *   .graph('programs')
   *   .graphType('StreamingProgram')
   *   .targetField('channelId')
   *   .sourceField('id');
   * // rel === 'programs:StreamingProgram(channelId, id)'
   * ```
   */
  sourceField(field: string): string {
    if (!this.graphName || !this.typeName || !this.target) {
      throw new Error('Cascade relationship requires graph, type, target, and source fields');
    }
    return `${this.graphName}:${this.typeName}(${this.target}, ${field})`;
  }
}

export default CascadeRelationshipBuilder;
