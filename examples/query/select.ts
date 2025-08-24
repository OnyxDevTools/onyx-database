// filename: examples/query/select.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const items = await db
    .from(tables.VodItem)
    .select(['id', 'title'])
    .list();

  console.log(items);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
