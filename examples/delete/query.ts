// filename: examples/delete/delete-all.ts
import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';
import { seed } from '../seed';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const user = await seed();
  const markerUsername = `obsolete-${user.id!.slice(0, 8)}`;
  await db.save(tables.User, {
    id: `obsolete-${user.id}`,
    username: markerUsername,
    email: `${markerUsername}@example.com`,
    isActive: false,
    lastLoginAt: null,
    deletedAt: null,
  });

  const deleted = await db
    .from(tables.User)
    .where(eq('username', markerUsername))
    .delete();

  console.log(`Deleted ${deleted} record(s).`);
  if (typeof deleted === 'number') {
    if (deleted <= 0) {
      throw new Error('Expected at least one user to be deleted');
    }
  } else if (Array.isArray(deleted)) {
    if (!deleted) throw new Error('Expected at least one deleted user');
  } else if (!deleted) {
    throw new Error('Delete returned no result');
  }
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
