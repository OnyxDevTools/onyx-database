// filename: examples/delete/basic.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';
import { seed } from '../seed';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  // Seed a user and then delete it by id so the example is self-contained.
  const user = await seed();

  const deleted = await db.delete(tables.User, user.id!); // returns true on success

  if (!deleted) {
    throw new Error(`Delete reported failure for user ${user.id}`);
  }

  const stillThere = await db.findById(tables.User, user.id!);
  if (stillThere) {
    throw new Error(`User ${user.id} still exists after delete`);
  }

  console.log(`Deleted user id=${user.id} and verified it is gone`);
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
