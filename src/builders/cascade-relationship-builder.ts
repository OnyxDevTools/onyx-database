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

  graph(name: string): ICascadeRelationshipBuilder {
    this.graphName = name;
    return this;
  }

  graphType(type: string): ICascadeRelationshipBuilder {
    this.typeName = type;
    return this;
  }

  targetField(field: string): ICascadeRelationshipBuilder {
    this.target = field;
    return this;
  }

  sourceField(field: string): string {
    if (!this.graphName || !this.typeName || !this.target) {
      throw new Error('Cascade relationship requires graph, type, target, and source fields');
    }
    return `${this.graphName}:${this.typeName}(${this.target}, ${field})`;
  }
}

export default CascadeRelationshipBuilder;
