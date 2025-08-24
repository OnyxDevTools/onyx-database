// filename: examples/query/aggregate.ts
import process from 'node:process';
import { onyx, count, avg, sum } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const stats = await db
    .select('streamType', sum('rating'))
    .from(tables.VodItem)
    .list();

  console.log(JSON.stringify(stats, null, 2)); // [{"sum(rating)": 321432}
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
