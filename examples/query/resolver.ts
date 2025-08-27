import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const users = await db
    .from(tables.User)
    .resolve('profile', 'roles.role', 'roles.role.permissions.permission')
    .limit(5)
    .list();

  console.log(JSON.stringify(users, null, 2));

  /*
  [
    {
      "id": "example-user-1",
      "username": "Example User",
      "profile": { ... },
      "roles": [
        {
          "role": {
            "permissions": [
              { "permission": { ... } }
            ]
          }
        }
      ]
    }
  ]
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
