import { describe, it, expect } from 'vitest';
import { CascadeRelationshipBuilder } from '../src/builders/cascade-relationship-builder';

describe('CascadeRelationshipBuilder', () => {
  it('builds relationship strings', () => {
    const rel = new CascadeRelationshipBuilder()
      .graph('programs')
      .graphType('StreamingProgram')
      .targetField('channelId')
      .sourceField('id');
    expect(rel).toBe('programs:StreamingProgram(channelId, id)');
  });

  it('throws if fields are missing', () => {
    const builder = new CascadeRelationshipBuilder();
    expect(() => builder.sourceField('id')).toThrow();
  });
});
