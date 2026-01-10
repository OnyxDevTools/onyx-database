// filename: examples/query/select.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const users = await db
    .select('username', 'email')
    .from(tables.User)
    .limit(2)
    .list();

  console.log(JSON.stringify(users, null, 2))
  if (!users.length) {
    throw new Error('Expected at least one user with selected fields');
  }
  if (users.some((u) => u.username == null || u.email == null)) {
    throw new Error('Selected fields missing on returned users');
  }
  /*
    [
      {
        "email": "basic@example.com",
        "username": "Example User"
      },
      {
        "email": "cascade@example.com",
        "username": "cascade"
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
