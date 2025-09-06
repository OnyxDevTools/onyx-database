// filename: examples/delete/basic.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const deleteCount = await db.delete(tables.User, "user-id-1") // throw error if user is not found

  console.log(`Deleted ${deleteCount} record(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
