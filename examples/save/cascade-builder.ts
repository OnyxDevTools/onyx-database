// filename: examples/save/cascade-builder.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const rel = db
    .cascadeBuilder()
    .graph('profile')
    .graphType('UserProfile')
    .targetField('userId')
    .sourceField('id');

  await db
    .cascade(rel)
    .save(tables.User, {
      id: 'cb-user-1',
      username: 'Cascade Builder',
      email: 'cascade-builder@example.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        id: 'cb-profile-1',
        userId: 'cb-user-1',
        firstName: 'Cascade',
        lastName: 'Builder',
      },
    });

  console.log('Saved user with cascadeBuilder');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
