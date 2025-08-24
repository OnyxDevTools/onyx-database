// filename: examples/query/aggregate.ts
import process from 'node:process';
import { onyx, count, avg } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const stats = await db
    .select('streamType', count('*'), avg('rating'))
    .from(tables.VodItem)
    .groupBy('streamType')
    .list();

  console.log(JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
