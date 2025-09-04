import { describe, it, expect, vi, afterEach } from 'vitest';
import { onyx } from '../src';

describe('logging via env vars', () => {
  afterEach(() => {
    delete process.env.ONYX_REQUEST_LOGGING_ENABLED;
    delete process.env.ONYX_RESPONSE_LOGGING_ENABLED;
    onyx.clearCacheConfig();
  });

  it('enables request logging from env', async () => {
    process.env.ONYX_REQUEST_LOGGING_ENABLED = '1';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: 'not found' } }),
        {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: fetchMock,
    });
    await db.findById('User', '1');
    expect(logSpy).toHaveBeenCalledWith('GET https://api.test/data/db/User/1');
    logSpy.mockRestore();
  });

  it('enables response logging from env', async () => {
    process.env.ONYX_RESPONSE_LOGGING_ENABLED = 'true';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: fetchMock,
    });
    await db.getDocument('doc1');
    expect(logSpy).toHaveBeenCalledWith('200 OK');
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
    logSpy.mockRestore();
  });
});
