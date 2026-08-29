import { describe, it, expect, vi } from 'vitest';
import { openJsonLinesStream, openMessagePackStream } from '../src/core/stream';
import { encodeMessagePack, MESSAGEPACK_MEDIA_TYPE } from '../src/core/msgpack';

const te = new TextEncoder();

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

describe('openJsonLinesStream', () => {
  it('parses SSE data lines', async () => {
    const reader = {
      cancel: vi.fn(),
      read: vi
        .fn<[], Promise<{ done: boolean; value?: Uint8Array }>>()
        .mockResolvedValueOnce({ done: false, value: te.encode('data: {"action":"CREATE","entity":{"id":1}}\n') })
        .mockResolvedValueOnce({ done: false, value: te.encode('data: {"action":"KEEP_ALIVE","entity":null}\n') })
        .mockImplementation(() => new Promise(() => {})),
    };
    const fetchImpl = vi
      .fn<[string, any], Promise<any>>()
      .mockResolvedValue({ ok: true, status: 200, statusText: 'OK', body: { getReader: () => reader } });

    const actions: string[] = [];
    const handle = await openJsonLinesStream<any>(fetchImpl as any, 'url', {}, {
      onItem: (_e, a) => actions.push(a),
    });
    // allow the pump loop to process queued chunks
    await new Promise((r) => setTimeout(r, 0));
    handle.cancel();
    expect(actions).toEqual(['CREATE']);
  });

  it('retries with exponential backoff', async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const reader = { cancel: vi.fn(), read: vi.fn().mockImplementation(() => new Promise(() => {})) };
    const fetchImpl = vi
      .fn<[string, any], Promise<any>>()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue({ ok: true, status: 200, statusText: 'OK', body: { getReader: () => reader } });

    const handlePromise = openJsonLinesStream<any>(fetchImpl as any, 'url');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.runOnlyPendingTimersAsync();
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 1000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    await vi.runOnlyPendingTimersAsync();
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 2000);
    expect(fetchImpl).toHaveBeenCalledTimes(3);

    const handle = await handlePromise;
    handle.cancel();
    setTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  it('stops after 4 retries', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn<[string, any], Promise<any>>().mockRejectedValue(new Error('fail'));
    const handlePromise = openJsonLinesStream<any>(fetchImpl as any, 'url');
    for (let i = 0; i < 4; i++) await vi.runOnlyPendingTimersAsync();
    const handle = await handlePromise;
    handle.cancel();
    expect(fetchImpl).toHaveBeenCalledTimes(5);
    await vi.runOnlyPendingTimersAsync();
    expect(fetchImpl).toHaveBeenCalledTimes(5);
    vi.useRealTimers();
  });
});

describe('openMessagePackStream', () => {
  it('decodes concatenated frames across chunks and skips nil flush frames', async () => {
    const payload = concatBytes(
      encodeMessagePack(null),
      encodeMessagePack({ action: 'CREATE', entity: { id: 1 } }),
      encodeMessagePack({ action: 'UPDATE', entity: { id: 1, name: 'Ada' } }),
    );
    const reader = {
      cancel: vi.fn(),
      read: vi
        .fn<[], Promise<{ done: boolean; value?: Uint8Array }>>()
        .mockResolvedValueOnce({ done: false, value: payload.slice(0, 5) })
        .mockResolvedValueOnce({ done: false, value: payload.slice(5, 19) })
        .mockResolvedValueOnce({ done: false, value: payload.slice(19) })
        .mockImplementation(() => new Promise(() => {})),
    };
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => MESSAGEPACK_MEDIA_TYPE },
      text: () => Promise.resolve(''),
      body: { getReader: () => reader },
    });
    const actions: string[] = [];

    const handle = await openMessagePackStream<{ id: number }>(fetchImpl, 'url', {}, {
      onItem: (_entity, action) => actions.push(action),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    handle.cancel();

    expect(actions).toEqual(['CREATE', 'UPDATE']);
    expect(reader.cancel).toHaveBeenCalledOnce();
  });

  it('decodes JSON-lines fallback based on response Content-Type', async () => {
    const reader = {
      cancel: vi.fn(),
      read: vi
        .fn<[], Promise<{ done: boolean; value?: Uint8Array }>>()
        .mockResolvedValueOnce({
          done: false,
          value: te.encode('{"action":"DELETE","entity":{"id":2}}\n'),
        })
        .mockImplementation(() => new Promise(() => {})),
    };
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/x-ndjson' },
      text: () => Promise.resolve(''),
      body: { getReader: () => reader },
    });
    const actions: string[] = [];

    const handle = await openMessagePackStream<{ id: number }>(fetchImpl, 'url', {}, {
      onItem: (_entity, action) => actions.push(action),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    handle.cancel();

    expect(actions).toEqual(['DELETE']);
  });
});
