import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { onyx, eq, contains, startsWith, gt } from '../src';
import { resolveConfig } from '../src/config/chain';

let hasConfig = true;
try {
  await resolveConfig();
} catch {
  hasConfig = false;
}

describe.runIf(hasConfig)('smoke e2e', () => {
  it('creates, queries, and deletes a channel', async () => {
    const db = onyx.init();

    const program = {
      start: new Date().toISOString(),
      title: 'Smoke Program',
      desc: 'Program Description',
      icon: 'http://example.com/dne.png',
      streamURL: 'http://example.com/dne',
    };

    const id = `news_${randomUUID()}`;
    const channelData = {
      id,
      category: 'news',
      name: 'News Smoke Test',
      updatedAt: new Date().toISOString(),
      programs: [program],
    };

    const saved = await db
      .cascade('programs:StreamingProgram(channelId, id)')
      .save('StreamingChannel', channelData)

    expect((saved as any).id).toBe(id);

    const retrieved = await db
      .from('StreamingChannel')
      .where(eq('id', id))
      .resolve('programs')
      .limit(1)
      .list();

    expect(retrieved.length).toBe(1);
    expect((retrieved as any)[0].programs?.length).toBe(1);

    const countBeforeDelete = await db
      .from('StreamingChannel')
      .where(eq('id', id))
      .count();
    expect(countBeforeDelete).toBe(1);

    const searchResults = await db
      .from('StreamingChannel')
      .where(eq('id', id))
      .and(eq('category', 'news'))
      .and(contains('name', 'News'))
      .and(startsWith('name', 'News'))
      .and(gt('updatedAt', '2000-01-01T00:00:00.000Z'))
      .limit(1)
      .list();

    expect(searchResults.length).toBe(1);
    expect((searchResults[0] as any).id).toBe(id);

    await db.cascade('programs').delete('StreamingChannel', id);

    const countAfterDelete = await db
      .from('StreamingChannel')
      .where(eq('id', id))
      .count();

    expect(countAfterDelete).toBe(0);

  }, 30000);
});

