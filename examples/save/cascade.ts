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
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const newUser: User = await db
    .cascade('profile:UserProfile(userId, id)')
    .save(tables.User, {
      id: 'cascade_001',
      username: 'cascade',
      email: 'cascade@example.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile,
    }) as User;

  console.log('Saved user:', newUser);

  const users = await db
    .from(tables.User)
    .where(eq('id', newUser.id))
    .resolve('profile')
    .limit(1)
    .list();

  console.log('user with profile:', JSON.stringify(users, null, 2));

  // cleanup
  await db.cascade('profile').delete(tables.User, newUser.id!);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
