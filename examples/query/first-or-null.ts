// filename: examples/query/first-or-null.ts
import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const maybeUser = await db
    .from(tables.Users)
    .where(eq('username', 'superman'))
    .firstOrNull();

  console.log(JSON.stringify(maybeUser, null, 2));

  const alsoUser = await db
    .from(tables.Users)
    .where(eq('username', 'DNE'))
    .one();

  console.log(`\nshould be null: ${JSON.stringify(alsoUser, null, 2)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
