// filename: examples/query/from.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const builder = db.from(tables.VodItem);
  console.log('Query builder initialized for table:', tables.VodItem);
  console.log(builder);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
