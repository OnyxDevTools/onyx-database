// filename: examples/query/update.ts
import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();
  const id = 'example-user-1';

  // Ensure a record exists to update.
  await db.save(tables.User, {
    id,
    username: 'Example User',
    email: 'basic@example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    lastLoginAt: null,
  });

  const updatedCount = await db
    .from(tables.User)
    .where(eq('id', id))
    .setUpdates({ isActive: false, updatedAt: new Date() })
    .update();

  const updatedTotal = Number(updatedCount);
  console.log(`Updated ${updatedTotal} record(s).`);
  if (!Number.isFinite(updatedTotal) || updatedTotal <= 0) {
    throw new Error('Expected at least one record to be updated');
  }

  const updatedUser = await db.findById(tables.User, id);
  if (!updatedUser || updatedUser.isActive !== false) {
    throw new Error('Record did not update to inactive as expected');
  }
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
