import { describe, it, expect, vi } from 'vitest';
import { QueryBuilder } from '../src/builders/query-builder';
import { ConditionBuilderImpl } from '../src/builders/condition-builder';
import { onyx } from '../src/impl/onyx';
import { inOp } from '../src/helpers/conditions';

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
    const other = new ConditionBuilderImpl({ field: 'f', operator: 'EQUAL', value: 6 });
    qb.from('users')
      .select('id', 'name')
      .select(['email'])
      .select()
      .resolve('rel1', 'rel2')
      .resolve(['rel3'])
      .resolve()
      .where({ field: 'a', operator: 'EQUAL', value: 1 })
      .where({ field: 'b', operator: 'EQUAL', value: 2 })
      .and({ field: 'c', operator: 'EQUAL', value: 3 })
      .and({ field: 'd', operator: 'EQUAL', value: 4 })
      .and(other)
      .or({ field: 'e', operator: 'EQUAL', value: 5 })
      .orderBy({ field: 'id', direction: 'asc' })
      .groupBy('role')
      .groupBy()
      .distinct()
      .limit(10)
      .inPartition('p1')
      .pageSize(5)
      .nextPage('tok');

    expect(await qb.count()).toBe(2);
    const first = await qb.list();
    expect(Array.from(first)).toEqual([{ id: 1 }]);
    expect(first.nextPage).toBe('n1');
    const second = await qb.list();
    expect(Array.from(second)).toEqual([]);
    expect(second.nextPage).toBeNull();
    await qb.page({ pageSize: 1, nextPage: 'x' });
    expect(exec.queryPage).toHaveBeenLastCalledWith('users', expect.any(Object), { pageSize: 5, nextPage: 'tok', partition: 'p1' });
    await qb.delete();
    qb.onItemAdded(() => {}).onItemUpdated(() => {}).onItemDeleted(() => {}).onItem(() => {});
    await qb.stream(false, true);
    qb.setUpdates({ id: 1 });
    await qb.update();
  });

  it('applies default partition from db config', async () => {
    const db = onyx.init({
      baseUrl: 'http://x',
      databaseId: 'd',
      apiKey: 'k',
      apiSecret: 's',
      fetch: vi.fn() as any,
      partition: 'p1',
    });
    (db as any)._queryPage = vi.fn().mockResolvedValue({ records: [], nextPage: null });
    await db.from('User').list();
    expect((db as any)._queryPage).toHaveBeenCalledWith(
      'User',
      expect.any(Object),
      { partition: 'p1', pageSize: undefined, nextPage: undefined },
    );
  });

  it('covers and/or branches', () => {
    const exec = makeExec();
    const a = new QueryBuilder(exec as any, 't');
    a.and({ field: 'x', operator: 'EQUAL', value: 1 });
    a.and({ field: 'y', operator: 'EQUAL', value: 2 });
    a.and({ field: 'z', operator: 'EQUAL', value: 3 });

    const b = new QueryBuilder(exec as any, 't');
    b.or({ field: 'x', operator: 'EQUAL', value: 1 });
    b.or({ field: 'y', operator: 'EQUAL', value: 2 });
    b.or({ field: 'z', operator: 'EQUAL', value: 3 });
    const c = new QueryBuilder(exec as any, 't');
    c.where({ field: 'x', operator: 'EQUAL', value: 1 }).or({ field: 'y', operator: 'EQUAL', value: 2 });
  });

  it('handles defaults and undefined branches', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, 't');
    await qb.page();
    await qb.stream();

    const qb2 = new QueryBuilder(exec as any, 't');
    await qb2.streamEventsOnly();
    await qb2.streamWithQueryResults(true);
    expect(exec.stream).toHaveBeenNthCalledWith(1, 't', expect.any(Object), true, false, expect.any(Object));
    expect(exec.stream).toHaveBeenNthCalledWith(2, 't', expect.any(Object), false, true, expect.any(Object));
    expect(exec.stream).toHaveBeenNthCalledWith(3, 't', expect.any(Object), true, true, expect.any(Object));

    const qbUpd = new QueryBuilder(exec as any, 't');
    qbUpd.setUpdates(undefined as any);
    await qbUpd.update();
  });

  it('preserves resolvers when provided as strings or spread arrays', async () => {
    const exec = {
      count: vi.fn(),
      queryPage: vi.fn().mockResolvedValue({ records: [], nextPage: null }),
      update: vi.fn(),
      deleteByQuery: vi.fn(),
      stream: vi.fn(),
    };
    const qb = new QueryBuilder(exec as any, 'users');

    await qb.resolve('roles').list();
    expect(exec.queryPage).toHaveBeenLastCalledWith(
      'users',
      expect.objectContaining({ resolvers: ['roles'] }),
      { pageSize: undefined, nextPage: undefined, partition: undefined },
    );

    await qb.resolve('roles', 'permissions').list();
    expect(exec.queryPage).toHaveBeenLastCalledWith(
      'users',
      expect.objectContaining({ resolvers: ['roles', 'permissions'] }),
      { pageSize: undefined, nextPage: undefined, partition: undefined },
    );

    const resolverList = ['roles'];
    await qb.resolve(...resolverList).list();
    expect(exec.queryPage).toHaveBeenLastCalledWith(
      'users',
      expect.objectContaining({ resolvers: ['roles'] }),
      { pageSize: undefined, nextPage: undefined, partition: undefined },
    );
  });

  it('serializes query builders nested in conditions', async () => {
    const exec = {
      count: vi.fn(),
      queryPage: vi.fn().mockResolvedValue({ records: [], nextPage: null }),
      update: vi.fn().mockResolvedValue('ok'),
      deleteByQuery: vi.fn(),
      stream: vi.fn(),
    };
    const innerSelect = new QueryBuilder(exec as any, 'child').select('id').limit(2);
    const outerSelect = new QueryBuilder(exec as any, 'parent').where(inOp('childId', innerSelect));
    await outerSelect.list();
    const selectArg = exec.queryPage.mock.calls[0][1];
    const nestedSelect = (selectArg.conditions as any).criteria.value;
    expect(nestedSelect).toMatchObject({
      type: 'SelectQuery',
      table: 'child',
      fields: ['id'],
      limit: 2,
    });

    const innerUpdate = new QueryBuilder(exec as any, 'child').setUpdates({ done: true });
    const outerUpdate = new QueryBuilder(exec as any, 'parent')
      .setUpdates({ active: false })
      .where(inOp('childId', innerUpdate));
    await outerUpdate.update();
    const updateArg = exec.update.mock.calls[0][1];
    const nestedUpdate = (updateArg.conditions as any).criteria.value;
    expect(nestedUpdate).toMatchObject({
      type: 'UpdateQuery',
      table: 'child',
      updates: { done: true },
    });
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
    qb.where({ field: 'id', operator: 'EQUAL', value: 1 });
    expect(await qb.firstOrNull()).toEqual({ id: 1 });
    expect(exec.queryPage.mock.calls[0][1].limit).toBe(1);
    expect(await qb.firstOrNull()).toBeNull();

    const qbAlias = new QueryBuilder(exec as any, 'users');
    qbAlias.where({ field: 'id', operator: 'EQUAL', value: 2 });
    exec.queryPage.mockResolvedValueOnce({ records: [{ id: 2 }] });
    expect(await qbAlias.one()).toEqual({ id: 2 });
  });

  it('returns first record without where when allowed', async () => {
    const exec = makeExec();
    exec.queryPage.mockResolvedValueOnce({ records: [{ id: 1 }] });
    const qb = new QueryBuilder(exec as any, 'users');
    expect(await qb.firstOrNull()).toEqual({ id: 1 });
    expect(exec.queryPage).toHaveBeenCalledTimes(1);
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
    const res = await db.from('User').where({ field: 'id', operator: 'EQUAL', value: 1 }).firstOrNull();
    expect(res).toEqual({ id: 1 });

    const qb = db.from('User');
    const qp = vi.fn().mockResolvedValueOnce({ records: [{ id: 3 }], nextPage: null });
    (db as any)._queryPage = qp;
    expect(await qb.firstOrNull()).toEqual({ id: 3 });
    expect(qp).toHaveBeenCalledTimes(1);

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

  it('ignores non-string inputs when flattening selects/resolvers', () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, 'users');
    // @ts-expect-error runtime ignores non-string entries
    qb.select('id', ['name'], 123);
    // @ts-expect-error runtime ignores non-string entries
    qb.resolve('rel1', ['rel2'], null);
    const select = (qb as any).toSelectQuery();
    expect(select.fields).toEqual(['id', 'name']);
    expect(select.resolvers).toEqual(['rel1', 'rel2']);
  });
});
