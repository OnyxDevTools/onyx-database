// filename: examples/query/find-by-id.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();
  const id = 'example-user-1';

  try {
    const user = await db.findById(tables.User, id);
    if (!user) {
      console.log('No record found for id:', id);
      return;
    }
    console.log(JSON.stringify(user, null, 2));

    /*
      {
        "id": "example-user-1",
        "createdAt": "2025-08-31T20:21:43.696Z",
        "deletedAt": null,
        "email": "basic@example.com",
        "isActive": true,
        "lastLoginAt": null,
        "updatedAt": "2025-08-31T20:21:43.696Z",
        "username": "Example User"
      }
    */
   
  } catch (err) {
    console.error('Error fetching record:', err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
