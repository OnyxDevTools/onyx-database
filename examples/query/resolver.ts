import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const usersWithRoles = await db
    .from(tables.User)
    .resolve('roles')
    .limit(5)
    .list();

  console.log(JSON.stringify(usersWithRoles, null, 2));

  /*
  [
    {
      "id": "example-user-1",
      "createdAt": "08/27/2025 01:47:29 AM UTC",
      "deletedAt": null,
      "email": "basic@example.com",
      "isActive": true,
      "lastLoginAt": null,
      "updatedAt": "08/27/2025 01:47:29 AM UTC",
      "username": "Example User",
      "roles": []
    },
    {
      "id": "example_user2",
      "createdAt": "08/27/2025 04:58:10 AM UTC",
      "deletedAt": null,
      "email": "cascade@example.com",
      "isActive": true,
      "lastLoginAt": null,
      "updatedAt": "08/27/2025 04:58:10 AM UTC",
      "username": "cascade",
      "roles": []
    }
  ]
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
