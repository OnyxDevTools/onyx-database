import { describe, it, expect } from 'vitest';
import { emitTypes, OnyxIntrospection } from '../gen/emit';

describe('emitTypes', () => {
  it('allows extra properties for graph attachments', () => {
    const schema: OnyxIntrospection = {
      tables: [
        {
          name: 'StreamingChannel',
          attributes: [
            { name: 'id', type: 'String', isNullable: false },
          ],
        },
      ],
    };
    const out = emitTypes(schema);
    expect(out).toContain('[key: string]: any;');
  });
});
