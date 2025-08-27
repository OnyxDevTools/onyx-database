// filename: examples/query/basic.ts
import { onyx, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const activeUsers = await db
    .from(tables.User)
    .where(eq('isActive', true))
    .limit(5)
    .list();

  console.log(JSON.stringify(activeUsers, null, 2));

  /* response: 
  [
    {
      "id": "example-user-1",
      "createdAt": "08/26/2025 07:47:29 PM MDT",
      "deletedAt": null,
      "email": "basic@example.com",
      "isActive": true,
      "lastLoginAt": null,
      "updatedAt": "08/26/2025 07:47:29 PM MDT",
      "username": "Example User"
    }
  ]
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
