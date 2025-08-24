import { describe, it, expect, vi } from 'vitest';
import { QueryBuilder } from '../src/builders/query-builder';
import { ConditionBuilderImpl } from '../src/builders/condition-builder';
import { OnyxError } from '../src/errors/onyx-error';
import { onyx } from '../src/impl/onyx';

function makeExec() {
  return {
    count: vi.fn().mockResolvedValue(2),
    queryPage: vi.fn()
      .mockResolvedValueOnce({ records: [{ id: 1 }], nextPage: 'n1' })
      .mockResolvedValueOnce({ records: null })
      .mockResolvedValue({ records: [], nextPage: null }),
    update: vi.fn().mockResolvedValue('u'),
    deleteByQuery: vi.fn().mockResolvedValue('d'),
    stream: vi.fn().mockResolvedValue({ cancel: vi.fn() })
  };
}

describe('QueryBuilder', () => {
  it('builds queries and executes operations', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, null);
    const other = new ConditionBuilderImpl({ field: 'f', operator: '=', value: 6 });
    qb.from('users')
      .selectFields(['id'])
      .selectFields([])
      .resolve('rel1')
      .resolve(['rel2'])
      .where({ field: 'a', operator: '=', value: 1 })
      .where({ field: 'b', operator: '=', value: 2 })
      .and({ field: 'c', operator: '=', value: 3 })
      .and({ field: 'd', operator: '=', value: 4 })
      .and(other)
      .or({ field: 'e', operator: '=', value: 5 })
      .orderBy({ field: 'id', direction: 'asc' })
      .groupBy('role')
      .groupBy()
      .distinct()
      .limit(10)
      .inPartition('p1')
      .pageSize(5)
      .nextPage('tok');

    expect(await qb.count()).toBe(2);
    expect(await qb.list()).toEqual([{ id: 1 }]);
    expect(await qb.list()).toEqual([]);
    await qb.page({ pageSize: 1, nextPage: 'x' });
    expect(exec.queryPage).toHaveBeenLastCalledWith('users', expect.any(Object), { pageSize: 5, nextPage: 'tok', partition: 'p1' });
    await qb.delete();
    qb.onItemAdded(() => {}).onItemUpdated(() => {}).onItemDeleted(() => {}).onItem(() => {});
    await qb.stream(false, true);
    qb.setUpdates({ id: 1 });
    await qb.update();
  });

  it('covers and/or branches', () => {
    const exec = makeExec();
    const a = new QueryBuilder(exec as any, 't');
    a.and({ field: 'x', operator: '=', value: 1 });
    a.and({ field: 'y', operator: '=', value: 2 });
    a.and({ field: 'z', operator: '=', value: 3 });

    const b = new QueryBuilder(exec as any, 't');
    b.or({ field: 'x', operator: '=', value: 1 });
    b.or({ field: 'y', operator: '=', value: 2 });
    b.or({ field: 'z', operator: '=', value: 3 });
    const c = new QueryBuilder(exec as any, 't');
    c.where({ field: 'x', operator: '=', value: 1 }).or({ field: 'y', operator: '=', value: 2 });
  });

  it('handles defaults and undefined branches', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, 't');
    await qb.page();
    await qb.stream();

    const qbUpd = new QueryBuilder(exec as any, 't');
    qbUpd.setUpdates(undefined as any);
    await qbUpd.update();
  });

  it('fetches first record or null and aliases one()', async () => {
    const exec = {
      count: vi.fn(),
      queryPage: vi
        .fn()
        .mockResolvedValueOnce({ records: [{ id: 1 }] })
        .mockResolvedValueOnce({ records: [] }),
      update: vi.fn(),
      deleteByQuery: vi.fn(),
      stream: vi.fn(),
    };
    const qb = new QueryBuilder(exec as any, 'users');
    qb.where({ field: 'id', operator: '=', value: 1 });
    expect(await qb.firstOrNull()).toEqual({ id: 1 });
    expect(exec.queryPage.mock.calls[0][1].limit).toBe(1);
    expect(await qb.firstOrNull()).toBeNull();

    const qbAlias = new QueryBuilder(exec as any, 'users');
    qbAlias.where({ field: 'id', operator: '=', value: 2 });
    exec.queryPage.mockResolvedValueOnce({ records: [{ id: 2 }] });
    expect(await qbAlias.one()).toEqual({ id: 2 });
  });

  it('requires a where clause for firstOrNull', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, 'users');
    await expect(qb.firstOrNull()).rejects.toBeInstanceOf(OnyxError);
  });

  it('disallows firstOrNull in update mode', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, 'users');
    qb.setUpdates({});
    await expect(qb.firstOrNull()).rejects.toThrow('Cannot call firstOrNull() in update mode.');
  });

  it('covers implementation builder firstOrNull', async () => {
    const db = onyx.init({ baseUrl: 'http://x', databaseId: 'd', apiKey: 'k', apiSecret: 's', fetch: vi.fn() as any });
    (db as any)._queryPage = vi.fn().mockResolvedValueOnce({ records: [{ id: 1 }], nextPage: null });
    const res = await db.from('User').where({ field: 'id', operator: '=', value: 1 }).firstOrNull();
    expect(res).toEqual({ id: 1 });

    const qb = db.from('User');
    await expect(qb.firstOrNull()).rejects.toBeInstanceOf(OnyxError);

    const qbUpd = db.from('User');
    qbUpd.setUpdates({});
    await expect(qbUpd.firstOrNull()).rejects.toThrow('Cannot call firstOrNull() in update mode.');
  });

  it('throws on improper usage', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, 'users');
    await expect(qb.update()).rejects.toThrow('Call setUpdates(...) before update().');
    qb.setUpdates({});
    await expect(qb.count()).rejects.toThrow('Cannot call count() in update mode.');
    await expect(qb.page()).rejects.toThrow('Cannot call page() in update mode.');
    await expect(qb.delete()).rejects.toThrow('delete() is only applicable in select mode.');
    await expect(qb.stream()).rejects.toThrow('Streaming is only applicable in select mode.');
  });

  it('validates table and conditions', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, null);
    await expect(qb.count()).rejects.toThrow('Table is not defined.');
    qb.from('users');
    expect(() => qb.where({} as any)).toThrow('Invalid condition passed to builder.');
  });
});
