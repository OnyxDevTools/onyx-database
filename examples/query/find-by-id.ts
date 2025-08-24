// filename: examples/query/find-by-id.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();
  const id = 'vod_001';

  try {
    const item = await db.findById(tables.VodItem, id);
    if (!item) {
      console.log('No record found for id:', id);
      return;
    }
    console.log(JSON.stringify(item, null, 2));
  } catch (err) {
    console.error('Error fetching record:', err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
