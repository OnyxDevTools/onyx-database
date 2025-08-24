// filename: examples/delete/basic.ts
import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const deleted = (await db
    .from(tables.VodItem)
    .where(eq('streamId', 1))
    .delete()) as number;

  console.log(`Deleted ${deleted} record(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
