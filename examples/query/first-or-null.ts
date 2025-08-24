// filename: examples/query/first-or-null.ts
import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const maybeVod = await db
    .from(tables.VodItem)
    .where(eq('title', 'Superman'))
    .firstOrNull();

  console.log(JSON.stringify(maybeVod, null, 2));

  const alsoVod = await db
    .from(tables.VodItem)
    .where(eq('title', 'DNE'))
    .one();

  console.log(`\nshould be null: ${JSON.stringify(alsoVod, null, 2)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
