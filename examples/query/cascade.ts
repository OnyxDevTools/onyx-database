// filename: examples/query/cascade.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const channels = await db
    .from(tables.StreamingChannel)
    .cascade('programs')
    .limit(3)
    .list();

  console.log(JSON.stringify(channels, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
