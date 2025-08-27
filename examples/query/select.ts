// filename: examples/query/select.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const users = await db
    .select('username', 'email')
    .from(tables.User)
    .limit(5)
    .list();

  console.log(users);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
