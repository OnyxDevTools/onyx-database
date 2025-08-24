// filename: examples/save/save.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const channel = await db.save(tables.StreamingChannel, {
    id: 'news_001',
    category: 'news',
    name: 'News 24',
    updatedAt: new Date().toISOString(),
  });

  console.log('Saved channel:', channel);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
