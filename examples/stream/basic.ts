// filename: examples/stream/basic.ts
import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from '../onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const events: Array<'added' | 'updated' | 'deleted'> = [];
  let handle: { cancel(): void } | null = null;
  const maybeCancel = (): void => {
    if (events.join(',') === 'added,updated,deleted') {
      handle?.cancel();
    }
  };

  const stream = db
    .from(tables.StreamingChannel)
    .where(eq('category', 'news'))
    .onItemAdded((item) => {
      console.log('ITEM ADDED', item);
      events.push('added');
      maybeCancel();
    })
    .onItemUpdated((item) => {
      console.log('ITEM UPDATED', item);
      events.push('updated');
      maybeCancel();
    })
    .onItemDeleted((item) => {
      console.log('ITEM DELETED', item);
      events.push('deleted');
      maybeCancel();
    })
    .onItem((entity, action) => {
      console.log('STREAM EVENT', action, entity);
    });

  handle = await stream.stream(true, false);
  setTimeout(() => {
    console.log('Stream timed out, cancelling');
    handle?.cancel();
  }, 5_000);

  await db.save(tables.StreamingChannel, {
    id: 'news_001',
    category: 'news',
    name: 'News 24',
    updatedAt: new Date(),
  });

  await db.save(tables.StreamingChannel, {
    id: 'news_001',
    category: 'news',
    name: 'News 24 - Updated',
    updatedAt: new Date(),
  });

  await db.delete(tables.StreamingChannel, 'news_001');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
