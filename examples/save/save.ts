// filename: examples/save/save.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const role = await db.save(tables.Role, {
    id: 'role_admin', // if omitted, onyx, will generate one for you based on the configured gen
    name: 'admin',
    description: 'Administrator role',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Saved role:', role); //Saved role: {id: 'role_admin', name: 'admin', description: 'Administrator role', isSystem: true, createdAt: '2025-08-27T05:18:36.905Z', …}
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
