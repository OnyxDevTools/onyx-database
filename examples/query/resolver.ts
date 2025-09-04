import process from 'node:process';
import { eq, onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';
import { seed } from '../seed';

async function main(): Promise<void> {
  const user = await seed() //creates user with roles and permissions

  const db = onyx.init<Schema>({requestLoggingEnabled: true, responseLoggingEnabled: true});

  // Example query: resolve profile and roles → permissions
  const users = await db
    .from(tables.User)
    .where(eq('id', user.id))
    .resolve(['profile', 'roles.permissions'])
    .limit(5)
    .list();

  console.log(JSON.stringify(users, null, 2));

  /*
  [
    {
      "id": "2274511a-89ba-11f0-0000-96c29f0340a4",
      "createdAt": "2025-09-04T18:08:18.345Z",
      "deletedAt": null,
      "email": "admin@example.com",
      "isActive": true,
      "lastLoginAt": null,
      "updatedAt": "2025-09-04T18:08:18.345Z",
      "username": "admin-user-1",
      "profile": {
        "id": "22825320-89ba-11f0-0000-96c2a485e60a",
        "address": null,
        "age": 42,
        "avatarUrl": null,
        "bio": "Seeded admin profile",
        "createdAt": "2025-09-04T18:08:18.437Z",
        "deletedAt": null,
        "firstName": "Example",
        "lastName": "Admin",
        "phone": null,
        "updatedAt": null,
        "userId": "2274511a-89ba-11f0-0000-96c29f0340a4"
      },
      "roles": [
        {
          "id": "223432c2-89ba-11f0-0000-96c285fa887c",
          "createdAt": "2025-09-04T18:08:17.925Z",
          "deletedAt": null,
          "description": "Administrators with full access",
          "isSystem": false,
          "name": "Admin",
          "updatedAt": "2025-09-04T18:08:17.925Z",
          "permissions": [
            {
              "id": "225697bb-89ba-11f0-0000-96c2936d96ff",
              "createdAt": "2025-09-04T18:08:18.150Z",
              "deletedAt": null,
              "description": "get user(s)",
              "name": "user.read",
              "updatedAt": "2025-09-04T18:08:18.150Z"
            },
            {
              "id": "2242ea26-89ba-11f0-0000-96c28bc0dfa6",
              "createdAt": "2025-09-04T18:08:18.021Z",
              "deletedAt": null,
              "description": "Create, update, and delete users",
              "name": "user.write",
              "updatedAt": "2025-09-04T18:08:18.021Z"
            }
          ]
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
