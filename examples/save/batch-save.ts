// filename: examples/save/batch-save.ts

import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const users = Array.from({ length: 5 }, (_, i) => ({
    id: `batch-user-${i}`,
    username: `Batch User ${i}`,
    email: `batch${i}@example.com`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.batchSave(tables.User, users, 2);

  console.log('Batch saved users:', users.length); //Batch saved users: 5
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
