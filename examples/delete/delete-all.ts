// filename: examples/delete/delete-all.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';
import { seed } from '../seed';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  // Seed upfront so there is data to delete.
  await seed();

  const deleted = await db.from(tables.User).delete();

  console.log(`Deleted ${deleted} user record(s).`);
  if (deleted <= 0) {
    throw new Error('Expected at least one user to be deleted');
  }

  // Re-seed so other examples still have baseline data.
  const reseededUser = await seed();
  console.log(`Reseeded user id=${reseededUser.id}`);
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
