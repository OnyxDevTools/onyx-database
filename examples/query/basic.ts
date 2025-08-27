// filename: examples/query/basic.ts
import process from 'node:process';
import { onyx, eq, gt } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const recentActive = await db
    .from(tables.Users)
    .where(eq('isActive', true))
    .and(gt('createdAt', new Date('2024-01-01')))
    .limit(5)
    .list();

  console.log(JSON.stringify(recentActive, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
