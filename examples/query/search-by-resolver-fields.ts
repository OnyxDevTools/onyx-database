// filename: examples/query/search-by-resolver-fields.ts

import process from 'node:process';
import { eq, onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';
import { seed } from 'seed';

async function main(): Promise<void> {
  const db = onyx.init<Schema>({requestLoggingEnabled: true});

  await seed();

  const admins = await db
    .from(tables.User)
    .where(eq("roles.name", "Admin"))
    .resolve('roles')
    .list();

  console.log(JSON.stringify(admins, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
