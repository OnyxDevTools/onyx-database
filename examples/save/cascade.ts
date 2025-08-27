// filename: examples/save/cascade.ts
import process from 'node:process';
import { eq, onyx } from '@onyx.dev/onyx-database';
import { Schema, tables, UserProfile, User } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const profile: UserProfile = {
    id: 'profile_001',
    userId: 'cascade_001',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    address: null,
    avatarUrl: null,
    bio: null,
    age: 24,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const newUser: User = await db
    .cascade('profile:UserProfile(userId, id)')
    .save(tables.User, {
      id: 'example_user2',
      username: 'cascade',
      email: 'cascade@example.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile,
    }) as User;

  console.log('Saved user:', JSON.stringify(newUser, null, 2));

  const users = await db
    .from(tables.User)
    .where(eq('id', newUser.id))
    .resolve('profile')
    .limit(1)
    .list();

  console.log('retreived user with profile:', JSON.stringify(users, null, 2));

  /*
  retreived user with profile: [
    {
      "id": "example_user2",
      "createdAt": "08/27/2025 04:56:33 AM UTC",
      "deletedAt": null,
      "email": "cascade@example.com",
      "isActive": true,
      "lastLoginAt": null,
      "updatedAt": "08/27/2025 04:56:33 AM UTC",
      "username": "cascade",
      "profile": {
        "id": "profile_001",
        "address": null,
        "avatarUrl": null,
        "bio": null,
        "createdAt": "08/27/2025 04:56:33 AM UTC",
        "deletedAt": null,
        "firstName": "Test",
        "lastName": "User",
        "phone": null,
        "updatedAt": "08/27/2025 04:56:33 AM UTC",
        "userId": "example_user2"
      }
    }
  ]
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
