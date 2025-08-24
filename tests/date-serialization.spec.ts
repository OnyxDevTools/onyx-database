import { describe, it, expect, vi } from 'vitest';
import { onyx } from '../src/impl/onyx';

// filename: tests/date-serialization.spec.ts

describe('Date serialization', () => {
  it('converts Date values to ISO strings in payloads', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const db = onyx.init({
      baseUrl: 'https://api.test',
      databaseId: 'db',
      apiKey: 'k',
      apiSecret: 's',
      fetch: fetchMock,
    });

    const d = new Date('2024-01-02T03:04:05Z');
    await db.save('Users', { createdAt: d });
    let body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.createdAt).toBe(d.toISOString());

    fetchMock.mockClear();
    await db.from('Users').setUpdates({ createdAt: d }).update();
    body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.updates.createdAt).toBe(d.toISOString());
  });
});
