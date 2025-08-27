// filename: examples/save/save.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const role = await db.save(tables.Roles, {
    id: 'role_admin',
    name: 'admin',
    description: 'Administrator role',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Saved role:', role);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
