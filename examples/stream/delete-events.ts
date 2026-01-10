import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from '../onyx/types';

// Emits a DELETE action when an entity is removed.
async function main(): Promise<void> {
  const streamDb = onyx.init<Schema>();
  const writeDb = onyx.init<Schema>();

  const stream = streamDb
    .from(tables.User)
    .onItem((user, action) => {
      if (action === 'DELETE') {
        console.log('USER DELETED', user);
      }
    });

  const handle = await stream.streamEventsOnly(true);

  await writeDb.save(tables.User, {
    id: 'stream_user_delete',
    username: 'delete-user',
    email: 'delete@example.com',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await writeDb.delete(tables.User, 'stream_user_delete');

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
