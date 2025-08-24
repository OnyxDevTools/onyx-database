import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { onyx, eq, contains, startsWith, gt } from '../src';

const requiredEnv = [
  'ONYX_DATABASE_BASE_URL',
  'ONYX_DATABASE_ID',
  'ONYX_DATABASE_API_KEY',
  'ONYX_DATABASE_API_SECRET',
];

const hasConfig = requiredEnv.every((key) => !!process.env[key]);

describe('smoke e2e', () => {
  (hasConfig ? it : it.skip)('creates, queries, and deletes a channel', async () => {
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
      name: 'News 24',
      updatedAt: new Date().toISOString(),
      programs: [program],
    };

    const saved = await db
      .cascade('programs:StreamingProgram(channelId, id)')
      .save('StreamingChannel', channelData);

    expect(saved.id).toBe(id);

    const retrieved = await db
      .from('StreamingChannel')
      .where(eq('id', id))
      .resolve('programs')
      .limit(1)
      .list();

    expect(retrieved.length).toBe(1);
    expect(retrieved[0].programs?.length).toBe(1);

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
    expect(searchResults[0].id).toBe(id);

    await db.cascade('programs').delete('StreamingChannel', id);

    const countAfterDelete = await db
      .from('StreamingChannel')
      .where(eq('id', id))
      .count();
    expect(countAfterDelete).toBe(0);
  }, 30000);
});

