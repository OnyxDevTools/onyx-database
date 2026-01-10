// filename: examples/stream/close.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from '../onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const handle = await db
    .from(tables.User)
    .onItem(() => {})
    .stream();

  handle.cancel();
  db.close();
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
