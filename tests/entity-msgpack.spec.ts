// filename: tests/entity-msgpack.spec.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onyx } from '../src';
import {
  decodeMessagePack,
  encodeMessagePack,
  MESSAGEPACK_ACCEPT,
  MESSAGEPACK_MEDIA_TYPE,
} from '../src/core/msgpack';
import type { FetchResponse } from '../src/types/common';

function messagePackResponse(value: unknown): FetchResponse {
  const bytes = encodeMessagePack(value);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => MESSAGEPACK_MEDIA_TYPE },
    text: () => Promise.reject(new Error('MessagePack responses must not be read as text')),
    arrayBuffer: () => Promise.resolve(bytes.slice().buffer as ArrayBuffer),
  };
}

afterEach(() => {
  onyx.clearCacheConfig();
  vi.restoreAllMocks();
});

describe('entity MessagePack integration', () => {
  it('uses MessagePack for entity CRUD and unary query routes', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/query/count/')) return Promise.resolve(messagePackResponse(1));
      if (url.includes('/query/update/')) return Promise.resolve(messagePackResponse({ updated: 1 }));
      if (url.includes('/query/delete/')) return Promise.resolve(messagePackResponse(1));
      if (url.includes('/query/')) {
        return Promise.resolve(
          messagePackResponse({ records: [{ id: 1, name: 'Ada' }], nextPage: null }),
        );
      }
      return Promise.resolve(messagePackResponse({ id: 1, name: 'Ada' }));
    });
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: fetchMock,
    });
    const created = new Date('2026-08-29T12:34:56.789Z');

    await db.save('User', { id: 1, created, profile: { active: true } });
    await expect(db.findById('User', '1')).resolves.toEqual({ id: 1, name: 'Ada' });
    await expect(db.from('User').list()).resolves.toMatchObject({ 0: { id: 1, name: 'Ada' } });
    await expect(db.from('User').count()).resolves.toBe(1);
    await expect(db.from('User').setUpdates({ name: 'Grace' }).update()).resolves.toEqual({
      updated: 1,
    });
    await expect(db.from('User').delete()).resolves.toBe(1);
    await expect(db.delete('User', '1')).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(7);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers.Accept).toBe(MESSAGEPACK_ACCEPT);
      if (init.body == null) {
        expect(init.headers['Content-Type']).toBeUndefined();
      } else {
        expect(init.headers['Content-Type']).toBe(MESSAGEPACK_MEDIA_TYPE);
        expect(init.body).toBeInstanceOf(Uint8Array);
      }
    }

    const saveBody = decodeMessagePack(fetchMock.mock.calls[0][1].body as Uint8Array);
    expect(saveBody).toEqual({
      id: 1,
      created: created.toISOString(),
      profile: { active: true },
    });
    const queryBodies = fetchMock.mock.calls
      .map(([, init]) => init.body)
      .filter((body): body is Uint8Array => body instanceof Uint8Array)
      .slice(1)
      .map((body) => decodeMessagePack(body));
    expect(queryBodies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'SelectQuery', table: 'User' }),
        expect.objectContaining({ type: 'UpdateQuery', updates: { name: 'Grace' } }),
      ]),
    );
  });

  it('keeps documents, schemas, AI, and model calls on JSON', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      let value: unknown = { ok: true };
      if (url.includes('/schemas/')) value = { databaseId: 'db', entities: [] };
      if (url.includes('/v1/models')) value = { object: 'list', data: [] };
      return Promise.resolve(
        new Response(JSON.stringify(value), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    const db = onyx.init({
      baseUrl: 'https://api.test',
      aiBaseUrl: 'https://ai.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: fetchMock,
    });

    await db.saveDocument({ documentId: 'doc-1', content: 'aGVsbG8=' });
    await db.getSchema();
    await db.ai.getModels();
    await db.predict('model-1', { age: 42 });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers.Accept).toBe('application/json');
      if (init.body != null) {
        expect(init.headers['Content-Type']).toBe('application/json');
        expect(typeof init.body).toBe('string');
      }
    }
  });

  it('sends query streams as MessagePack and consumes self-delimiting frames', async () => {
    const event = encodeMessagePack({ action: 'CREATE', entity: { id: 9 } });
    const reader = {
      cancel: vi.fn(),
      read: vi
        .fn<[], Promise<{ done: boolean; value?: Uint8Array }>>()
        .mockResolvedValueOnce({ done: false, value: event })
        .mockImplementation(() => new Promise(() => {})),
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => MESSAGEPACK_MEDIA_TYPE },
      text: () => Promise.resolve(''),
      body: { getReader: () => reader },
    });
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: fetchMock,
    });
    const received: unknown[] = [];

    const handle = await db.from('User').onItemAdded((entity) => received.push(entity)).stream();
    await new Promise((resolve) => setTimeout(resolve, 0));
    handle.cancel();

    expect(received).toEqual([{ id: 9 }]);
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers).toMatchObject({
      Accept: MESSAGEPACK_ACCEPT,
      'Content-Type': MESSAGEPACK_MEDIA_TYPE,
    });
    expect(init.body).toBeInstanceOf(Uint8Array);
    expect(decodeMessagePack(init.body as Uint8Array)).toMatchObject({
      type: 'SelectQuery',
      table: 'User',
    });
    expect(reader.cancel).toHaveBeenCalledOnce();
  });
});
