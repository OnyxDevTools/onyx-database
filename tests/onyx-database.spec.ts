import { describe, it, expect, vi } from 'vitest';
import { onyx } from '../src';

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
    expect(spy).toHaveBeenNthCalledWith(1, 'User', [{ id: 1 }, { id: 2 }]);
    expect(spy).toHaveBeenNthCalledWith(2, 'User', [{ id: 3 }]);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
