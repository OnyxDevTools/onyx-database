// filename: examples/query/update.ts
import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const updated = await db
    .from(tables.User)
    .where(eq('id', 'example-user-1'))
    .setUpdates({ isActive: false })
    .update() as number;

  console.log(`Updated ${updated} record(s).`); //Updated 1 record(s).
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
