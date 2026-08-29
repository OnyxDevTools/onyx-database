import { describe, it, expect, afterEach, vi } from 'vitest';
import pkg from '../package.json';
import { onyx, sdkName, sdkVersion } from '../src/edge';
import {
  decodeMessagePack,
  encodeMessagePack,
  MESSAGEPACK_ACCEPT,
  MESSAGEPACK_MEDIA_TYPE,
} from '../src/core/msgpack';

const cfg = {
  baseUrl: 'http://edge',
  databaseId: 'edge-db',
  apiKey: 'edge-key',
  apiSecret: 'edge-secret',
  fetch: async () => new Response('ok'),
};

afterEach(() => {
  onyx.clearCacheConfig();
});

describe('edge entry', () => {
  it('exports sdk metadata and initializes', () => {
    expect(sdkName).toBe(pkg.name);
    expect(sdkVersion).toBe(pkg.version);
    const db = onyx.init(cfg);
    expect(db).toBeTruthy();
  });

  it('uses Web API byte primitives for MessagePack entity requests', async () => {
    const responseBytes = encodeMessagePack({ id: 1 });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => MESSAGEPACK_MEDIA_TYPE },
      text: () => Promise.resolve(''),
      arrayBuffer: () => Promise.resolve(responseBytes.slice().buffer as ArrayBuffer),
    });
    const db = onyx.init({
      ...cfg,
      wireFormat: 'msgpack',
      fetch: fetchMock,
    });

    await expect(db.save('User', { id: 1 })).resolves.toEqual({ id: 1 });

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers).toMatchObject({
      Accept: MESSAGEPACK_ACCEPT,
      'Content-Type': MESSAGEPACK_MEDIA_TYPE,
    });
    expect(init.body).toBeInstanceOf(Uint8Array);
    expect(decodeMessagePack(init.body as Uint8Array)).toEqual({ id: 1 });
  });
});
