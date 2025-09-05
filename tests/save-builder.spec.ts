import { describe, it, expect, vi } from 'vitest';
import { SaveBuilder } from '../src/builders/save-builder';

describe('SaveBuilder', () => {
  it('saves a single entity with and without relationships', async () => {
    const save = vi.fn().mockResolvedValue('ok');
    const db = { save } as any;
    const builder = new SaveBuilder(db, 'Users');
    await builder.one({ id: 1 });
    expect(save).toHaveBeenCalledWith('Users', { id: 1 }, undefined);

    builder.cascade('rel');
    await builder.one({ id: 2 });
    expect(save).toHaveBeenLastCalledWith('Users', { id: 2 }, { relationships: ['rel'] });
  });

  it('saves many entities with and without relationships', async () => {
    const save = vi.fn().mockResolvedValue('ok');
    const db = { save } as any;
    const builder = new SaveBuilder(db, 'Users');
    await builder.many([{ id: 1 }]);
    expect(save).toHaveBeenCalledWith('Users', [{ id: 1 }], undefined);

    builder.cascade(['relA', 'relB']);
    await builder.many([{ id: 2 }, { id: 3 }]);
    expect(save).toHaveBeenLastCalledWith('Users', [{ id: 2 }, { id: 3 }], { relationships: ['relA', 'relB'] });
  });
});
