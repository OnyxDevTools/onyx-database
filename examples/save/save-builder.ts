// filename: examples/save/save-builder.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const user = await db
    .save(tables.User)
    .one({
      id: 'builder-user-1',
      username: 'Builder User',
      email: 'builder@example.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  console.log('Saved user with builder:', user);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
