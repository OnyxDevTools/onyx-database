// filename: examples/stream/basic.ts
import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from '../onyx/types';

async function main(): Promise<void> {
  // Use separate clients for streaming and writes so change events are
  // delivered back to the stream connection.
  const streamDb = onyx.init<Schema>();
  const writeDb = onyx.init<Schema>();

  const events: Array<'added' | 'updated' | 'deleted'> = [];
  let handle: { cancel(): void } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = (): void => {
    handle?.cancel();
    if (timer) clearTimeout(timer);
    console.log('Stream cancelled');
  };

  const maybeCancel = (): void => {
    if (events.join(',') === 'added,updated,deleted') {
      console.log('All events received');
      cancel();
    }
  };

  const stream = streamDb
    .from(tables.User)
    .where(eq('isActive', true))
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

  // keep the connection alive so subsequent saves trigger events
  try {
    handle = await stream.stream(true, true);
    console.log('Stream started');
  } catch (err) {
    console.error('Stream failed', err);
    cancel();
    return;
  }

  // allow the server to flush initial results before issuing writes
  await new Promise((resolve) => setTimeout(resolve, 500));
  timer = setTimeout(() => {
    console.log('Stream timed out, cancelling');
    cancel();
  }, 10_000);

  try {
    await writeDb.save(tables.User, {
      id: 'stream_user_001',
      username: 'stream_user',
      email: 'stream@example.com',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // give the server a moment to emit the add event
    await new Promise((resolve) => setTimeout(resolve, 500));

    await writeDb.save(tables.User, {
      id: 'stream_user_001',
      username: 'stream_user_updated',
      email: 'stream@example.com',
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // allow the update event to flush before deletion
    await new Promise((resolve) => setTimeout(resolve, 500));

    await writeDb.delete(tables.User, 'stream_user_001');

    // give the server a moment to emit the delete event
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (err) {
    console.error('Write failed', err);
    cancel();
    return;
  }
}

/* console logs look like this: 

*/

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
