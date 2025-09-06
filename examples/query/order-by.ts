// filename: examples/query/order-by.ts

import process from 'node:process';
import { onyx, desc } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const users = await db
    .from(tables.User)
    .selectFields("id", "email", "createdAt")
    .orderBy(desc('createdAt'))
    .limit(3)
    .list();

  console.log(JSON.stringify(users, null, 2));
  /*
    [
      {
        "id": "example-user-1",
        "email": "basic@example.com",
        "createdAt": "2025-08-26T19:47:29.000Z"
      }
    ]
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
