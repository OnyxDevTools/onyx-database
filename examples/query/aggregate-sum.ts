// filename: examples/query/aggregate.ts
import process from 'node:process';
import { onyx, count } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const stats = await db
    .select(count('id'))
    .from(tables.User)
    .list();

  console.log(JSON.stringify(stats, null, 2)); // [{"count(id)": 3}]
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
