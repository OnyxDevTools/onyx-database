import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from '../onyx/types';
import { retryWriteOperation, sleep, waitForUserState } from './event-write-helpers';

// Watches for UPDATE actions. After an existing entity is saved,
// the stream delivers an action of type 'UPDATE'.
async function main(): Promise<void> {
  const streamDb = onyx.init<Schema>();
  const writeDb = onyx.init<Schema>();
  const userId = `stream_user_update_${Date.now().toString(36)}`;
  const createdAt = new Date();
  const updatedAt = new Date();

  const stream = streamDb
    .from(tables.User)
    .onItem((user, action) => {
      if (action === 'UPDATE') {
        console.log('USER UPDATED', user);
      }
    });

  const handle = await stream.streamEventsOnly(true);

  // Seed a user then update to trigger the event.
  await retryWriteOperation(
    writeDb,
    'update-events-create',
    () =>
      writeDb.save(tables.User, {
        id: userId,
        username: 'update-user',
        email: 'update@example.com',
        isActive: true,
        lastLoginAt: null,
        createdAt,
        updatedAt,
      }),
    () => waitForUserState(writeDb, userId, (existing) => existing?.id === userId),
  );

  await retryWriteOperation(
    writeDb,
    'update-events-update',
    () =>
      writeDb.save(tables.User, {
        id: userId,
        username: 'update-user-updated',
        email: 'update@example.com',
        isActive: true,
        lastLoginAt: new Date(),
        createdAt,
        updatedAt: new Date(),
      }),
    () =>
      waitForUserState(
        writeDb,
        userId,
        (existing) => existing?.id === userId && existing.username === 'update-user-updated',
      ),
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
