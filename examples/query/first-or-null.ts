// filename: examples/query/first-or-null.ts
import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const maybeUser = await db
    .from(tables.User)
    .where(eq('email', 'basic@example.com'))
    .firstOrNull();

  console.log(JSON.stringify(maybeUser, null, 2));

  /* 
  {
    "id": "example-user-1",
    "createdAt": "08/27/2025 01:47:29 AM UTC",
    "deletedAt": null,
    "email": "basic@example.com",
    "isActive": true,
    "lastLoginAt": null,
    "updatedAt": "08/27/2025 01:47:29 AM UTC",
    "username": "Example User"
  }
  */

  const alsoUser = await db
    .from(tables.User)
    .where(eq('email', 'notfound@example.com'))
    .one();

  console.log(`\nshould be null: ${JSON.stringify(alsoUser, null, 2)}`); //should be null: null 
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
