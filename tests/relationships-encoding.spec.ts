import { describe, it, expect, vi } from 'vitest';
import { onyx } from '../src';

// filename: tests/relationships-encoding.spec.ts

describe('relationship encoding', () => {
  const cfg = {
    baseUrl: 'https://api.test',
    databaseId: 'db',
    apiKey: 'k',
    apiSecret: 's',
  };

  it('encodes delete relationships once', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    const db = onyx.init({ ...cfg, fetch: fetchMock });
    await db.delete('Channels', '1', {
      relationships: ['programs:StreamingProgram(channelId,id)'],
    });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(
      'relationships=programs%3AStreamingProgram%28channelId%2Cid%29'
    );
    expect(url).not.toContain('%253A');
  });

  it('encodes save relationships once', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    const db = onyx.init({ ...cfg, fetch: fetchMock });
    await db.save('Channels', { id: 1 }, {
      relationships: ['programs:StreamingProgram(channelId,id)'],
    });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(
      'relationships=programs%3AStreamingProgram%28channelId%2Cid%29'
    );
    expect(url).not.toContain('%253A');
  });
});
