// filename: examples/save/basic.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const user = await db.save(tables.Users, {
    id: 'user_basic',
    username: 'basic',
    email: 'basic@example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Saved user:', user);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
