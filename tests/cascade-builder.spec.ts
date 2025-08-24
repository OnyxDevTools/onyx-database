import { describe, it, expect, vi } from 'vitest';
import { CascadeBuilder } from '../src/builders/cascade-builder';

describe('CascadeBuilder', () => {
  it('saves with and without relationships', async () => {
    const save = vi.fn().mockResolvedValue('ok');
    const db = { save } as any;
    const builder = new CascadeBuilder(db);

    await builder.save('Users', { id: 1 });
    expect(save).toHaveBeenCalledWith('Users', { id: 1 }, undefined);

    builder.cascade('relA', 'relB');
    await builder.save('Users', [{ id: 2 }]);
    expect(save).toHaveBeenLastCalledWith('Users', [{ id: 2 }], { relationships: ['relA', 'relB'] });
  });

  it('deletes with and without relationships', async () => {
    const del = vi.fn().mockResolvedValue('ok');
    const db = { delete: del } as any;
    const builder = new CascadeBuilder(db);

    await builder.delete('Users', '1');
    expect(del).toHaveBeenCalledWith('Users', '1', undefined);

    builder.cascade('rel');
    await builder.delete('Users', '2');
    expect(del).toHaveBeenLastCalledWith('Users', '2', { relationships: ['rel'] });
  });
});
