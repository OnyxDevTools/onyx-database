import process from 'node:process';
import { eq, onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';
import { seed } from '../seed';

async function main(): Promise<void> {
  await seed() //creates user with roles an permissions

  const db = onyx.init<Schema>();

  // Example query: resolve profile and roles → permissions
  const users = await db
    .from(tables.User)
    .where(eq('email', 'admin@example.com'))
    .resolve(['profile', 'roles.permissions'])
    .limit(5)
    .list();

  console.log(JSON.stringify(users, null, 2));

  /*
  [
    {
      "id": "example-user-1",
      "username": "Example Admin",
      "profile": { ... },
      "roles": [
        {
          "role": {
            "name": "Admin",
            "permissions": [
              { "permission": { "name": "user.write", ... } }
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
