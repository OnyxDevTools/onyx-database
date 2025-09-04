import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from '../onyx/types';

// Watches for UPDATE actions. After an existing entity is saved,
// the stream delivers an action of type 'UPDATE'.
async function main(): Promise<void> {
  const streamDb = onyx.init<Schema>();
  const writeDb = onyx.init<Schema>();

  const stream = streamDb
    .from(tables.User)
    .onItem((user, action) => {
      if (action === 'UPDATE') {
        console.log('USER UPDATED', user);
      }
    });

  const handle = await stream.streamEventsOnly(true);

  // Seed a user then update to trigger the event.
  await writeDb.save(tables.User, {
    id: 'stream_user_update',
    username: 'update-user',
    email: 'update@example.com',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await writeDb.save(tables.User, {
    id: 'stream_user_update',
    username: 'update-user-updated',
    email: 'update@example.com',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  setTimeout(() => handle.cancel(), 500);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
