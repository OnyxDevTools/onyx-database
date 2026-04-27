import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from '../onyx/types';
import { retryWriteOperation, sleep, waitForUserState } from './event-write-helpers';

// Emits a DELETE action when an entity is removed.
async function main(): Promise<void> {
  const streamDb = onyx.init<Schema>();
  const writeDb = onyx.init<Schema>();
  const userId = `stream_user_delete_${Date.now().toString(36)}`;

  const stream = streamDb
    .from(tables.User)
    .onItem((user, action) => {
      if (action === 'DELETE') {
        console.log('USER DELETED', user);
      }
    });

  const handle = await stream.streamEventsOnly(true);

  await retryWriteOperation(
    writeDb,
    'delete-events-create',
    () =>
      writeDb.save(tables.User, {
        id: userId,
        username: 'delete-user',
        email: 'delete@example.com',
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    () => waitForUserState(writeDb, userId, (existing) => existing?.id === userId),
  );

  await retryWriteOperation(
    writeDb,
    'delete-events',
    () => writeDb.delete(tables.User, userId),
    () => waitForUserState(writeDb, userId, (existing) => !existing),
  );

  await sleep(500);
  handle.cancel();
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
