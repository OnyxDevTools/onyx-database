import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from '../onyx/types';

// Listens for CREATE events on a stream. When a new entity is saved,
// the stream emits an action of type 'CREATE'.
async function main(): Promise<void> {
  // Separate clients ensure the write triggers an event on the stream connection.
  const streamDb = onyx.init<Schema>();
  const writeDb = onyx.init<Schema>();

  const stream = streamDb
    .from(tables.User)
    .onItem((user, action) => {
      if (action === 'CREATE') {
        console.log('USER CREATED', user);
      }
    });

  // Listen only for events and keep the connection alive.
  const handle = await stream.streamEventsOnly(true);

  await writeDb.save(tables.User, {
    id: 'stream_user_create',
    username: 'create-user',
    email: 'create@example.com',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Allow the event to flush then cancel the stream.
  setTimeout(() => handle.cancel(), 500);
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
