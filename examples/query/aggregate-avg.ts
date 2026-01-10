// filename: examples/query/aggregate.ts

import process from 'node:process';
import { onyx, avg } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const stats = await db
    .select(avg('age'))
    .from(tables.UserProfile)
    .list();

  console.log(JSON.stringify(stats, null, 2)); // [{"avg(age)": 24}]
  if (!stats.length) {
    throw new Error('Expected at least one aggregate result');
  }
  const avgValue = stats[0]?.['avg(age)'];
  if (avgValue == null) {
    throw new Error('Average age was not returned');
  }
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
