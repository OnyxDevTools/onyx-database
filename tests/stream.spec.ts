import { describe, it, expect, vi } from 'vitest';
import { openJsonLinesStream } from '../src/core/stream';

const te = new TextEncoder();

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
});
