// filename: examples/query/order-by.ts

import process from 'node:process';
import { onyx, desc } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const users = await db
    .from(tables.User)
    .select("id", "email", "createdAt")
    .orderBy(desc('createdAt'))
    .limit(3)
    .list();

  console.log(JSON.stringify(users, null, 2));
  if (!users.length) {
    throw new Error('Expected at least one user ordered by createdAt');
  }
  if (users.length > 3) {
    throw new Error('Query returned more than the requested limit');
  }
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

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
