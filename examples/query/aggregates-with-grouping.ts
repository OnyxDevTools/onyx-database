// filename: examples/query/aggregate.ts
import process from 'node:process';
import { onyx, count } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const stats = await db
    .select('isActive', count("id"))
    .from(tables.User)
    .groupBy('isActive')
    .list();

  console.log(JSON.stringify(stats, null, 2));

// response looks like this:
// [
//   {
//     "count(id)": 1,
//     "isActive": false
//   },
//   {
//     "count(id)": 41,
//     "isActive": true
//   }
// ]

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
