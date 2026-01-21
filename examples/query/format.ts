// filename: examples/query/format.ts

import process from 'node:process';
import { onyx, format } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const rows = await db
    .select(format('age', '000'))
    .from(tables.UserProfile)
    .limit(1)
    .list();

  if (!rows.length) {
    throw new Error('Expected at least one formatted result');
  }
  const key = "format(age, '000')";
  const formatted = rows[0]?.[key];
  if (formatted == null) {
    throw new Error('Formatted value was not returned');
  }

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
