import { describe, it, expect, vi } from 'vitest';
import { onyx } from '../src';
import type { SchemaUpsertRequest } from '../src/types/public';
import { inOp } from '../src/helpers/conditions';

describe('OnyxDatabaseImpl helpers', () => {
  it('returns null on 404 from findById', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'not found' } }), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: fetchMock,
    });
    const res = await db.findById('User', '1');
    expect(res).toBeNull();
  });

  it('splits batchSave into chunks', async () => {
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: vi.fn(),
    });
    const spy = vi.spyOn(db as any, '_saveInternal').mockResolvedValue('ok');
    await db.batchSave('User', [{ id: 1 }, { id: 2 }, { id: 3 }], 2);
    expect(spy).toHaveBeenNthCalledWith(1, 'User', [{ id: 1 }, { id: 2 }], undefined);
    expect(spy).toHaveBeenNthCalledWith(2, 'User', [{ id: 3 }], undefined);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('applies default partition from init', async () => {
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: vi.fn(),
      partition: 'p1',
    });
    const saveSpy = vi.spyOn(db as any, '_saveInternal').mockResolvedValue('ok');
    await db.save('User', { id: 1 });
    expect(saveSpy).toHaveBeenCalledWith('User', { id: 1 }, undefined);

    const request = vi.fn().mockResolvedValue({});
    vi.spyOn(db as any, 'ensureClient').mockResolvedValue({
      http: { request },
      databaseId: 'db',
      baseUrl: '',
      fetchImpl: vi.fn(),
    });
    await db.findById('User', '1');
    expect(request).toHaveBeenCalledWith(
      'GET',
      expect.stringContaining('/data/db/User/1?partition=p1'),
    );
  });

  it('normalizes nested query builders before sending requests', async () => {
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: vi.fn(),
    });
    const queryPage = vi.fn().mockResolvedValue({ records: [], nextPage: null });
    const update = vi.fn().mockResolvedValue('ok');
    (db as any)._queryPage = queryPage;
    (db as any)._update = update;

    const innerSelect = db.select('id').from('Other').limit(1);
    await db.from('Example').where(inOp('refId', innerSelect)).list();
    const nestedSelect = (queryPage.mock.calls[0][1].conditions as any).criteria.value;
    expect(nestedSelect).toMatchObject({
      type: 'SelectQuery',
      table: 'Other',
      fields: ['id'],
      limit: 1,
    });

    const innerUpdate = db.from('Other').setUpdates({ status: 'closed' });
    await db
      .from('Example')
      .setUpdates({ status: 'open' })
      .where(inOp('refId', innerUpdate))
      .update();
    const nestedUpdate = (update.mock.calls[0][1].conditions as any).criteria.value;
    expect(nestedUpdate).toMatchObject({
      type: 'UpdateQuery',
      table: 'Other',
      updates: { status: 'closed' },
    });
  });

  it('calls secrets endpoints with expected paths', async () => {
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: vi.fn(),
    });
    const request = vi.fn().mockResolvedValue({});
    vi.spyOn(db as any, 'ensureClient').mockResolvedValue({
      http: { request },
      databaseId: 'db',
      baseUrl: '',
      fetchImpl: vi.fn(),
    });

    await db.listSecrets();
    await db.getSecret('api-key');
    await db.putSecret('api-key', { value: 'secret', purpose: 'p' });
    await db.deleteSecret('api-key');

    expect(request).toHaveBeenNthCalledWith(
      1,
      'GET',
      '/database/db/secret',
      undefined,
      { 'Content-Type': 'application/json' },
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      'GET',
      '/database/db/secret/api-key',
      undefined,
      { 'Content-Type': 'application/json' },
    );
    expect(request).toHaveBeenNthCalledWith(
      3,
      'PUT',
      '/database/db/secret/api-key',
      { value: 'secret', purpose: 'p' },
    );
    expect(request).toHaveBeenNthCalledWith(4, 'DELETE', '/database/db/secret/api-key');
  });

  it('calls schema endpoints with expected paths', async () => {
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: vi.fn(),
    });
    const request = vi.fn().mockResolvedValue({});
    vi.spyOn(db as any, 'ensureClient').mockResolvedValue({
      http: { request },
      databaseId: 'db',
      baseUrl: '',
      fetchImpl: vi.fn(),
    });

    await db.getSchema();
    await db.getSchema({ tables: ['user', 'profile'] });
    await db.getSchemaHistory();
    await db.updateSchema({ revisionDescription: 'test', entities: [], entityText: 'omit' } as SchemaUpsertRequest & { entityText: string });
    await db.updateSchema({ entities: [], entityText: 'omit' } as SchemaUpsertRequest & { entityText: string }, { publish: true });
    await db.validateSchema({ entities: [], entityText: 'omit' } as SchemaUpsertRequest & { entityText: string });

    expect(request).toHaveBeenNthCalledWith(1, 'GET', '/schemas/db');
    expect(request).toHaveBeenNthCalledWith(2, 'GET', '/schemas/db?tables=user%2Cprofile');
    expect(request).toHaveBeenNthCalledWith(3, 'GET', '/schemas/history/db');
    expect(request).toHaveBeenNthCalledWith(
      4,
      'PUT',
      '/schemas/db',
      { revisionDescription: 'test', entities: [], databaseId: 'db' },
    );
    expect(request).toHaveBeenNthCalledWith(5, 'PUT', '/schemas/db?publish=true', {
      entities: [],
      databaseId: 'db',
    });
    expect(request).toHaveBeenNthCalledWith(6, 'POST', '/schemas/db/validate', {
      entities: [],
      databaseId: 'db',
    });
  });

  it('strips entityText from schema payloads and responses', async () => {
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: vi.fn(),
    });
    const request = vi.fn().mockImplementation((method, path, body) => {
      if (method === 'GET' && path === '/schemas/db') {
        return { databaseId: 'db', entities: [], entityText: 'raw' };
      }
      if (method === 'GET' && path === '/schemas/history/db') {
        return [{ databaseId: 'db', entities: [], entityText: 'raw-history' }];
      }
      if (method === 'PUT' && path.startsWith('/schemas/db')) {
        expect(body).toEqual({ entities: [], databaseId: 'db' });
        return { databaseId: 'db', entities: [], entityText: 'raw-update' };
      }
      if (method === 'POST' && path === '/schemas/db/validate') {
        expect(body).toEqual({ entities: [], databaseId: 'db' });
        return {
          valid: true,
          schema: { databaseId: 'db', entities: [], entityText: 'raw-validate' },
        };
      }
      return {};
    });
    vi.spyOn(db as any, 'ensureClient').mockResolvedValue({
      http: { request },
      databaseId: 'db',
      baseUrl: '',
      fetchImpl: vi.fn(),
    });

    const schema = await db.getSchema();
    expect((schema as any).entityText).toBeUndefined();

    const history = await db.getSchemaHistory();
    expect(history[0]).toBeDefined();
    expect((history[0] as any).entityText).toBeUndefined();

    const updated = await db.updateSchema({ entities: [], entityText: 'omit' } as SchemaUpsertRequest & { entityText: string });
    expect((updated as any).entityText).toBeUndefined();

    const validation = await db.validateSchema({ entities: [], entityText: 'omit' } as SchemaUpsertRequest & { entityText: string });
    expect((validation.schema as any)?.entityText).toBeUndefined();
  });
});
