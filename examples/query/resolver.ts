import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const usersWithRoles = await db
    .from(tables.Users)
    .resolve('roles')
    .limit(5)
    .list();

  console.log(JSON.stringify(usersWithRoles, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
