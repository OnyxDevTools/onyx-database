// filename: examples/query/first-or-null-all-data.ts
// Learn how to fetch a single record with firstOrNull() without a where() filter.

import process from 'node:process';
import { onyx, desc } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();
  const id = 'first-or-null-user-1';

  // Seed a user so there is always data to read.
  await db.save(tables.User, {
    id,
    username: 'First Or Null User',
    email: 'first-or-null@example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    lastLoginAt: null,
  });

  // Fetch the newest user by createdAt without adding a where() clause.
  const latestUser = await db
    .from(tables.User)
    .orderBy(desc('createdAt'))
    .limit(1)
    .firstOrNull();

  if (!latestUser) {
    throw new Error('Expected a record from firstOrNull without where');
  }

  console.log('Latest user:', JSON.stringify(latestUser, null, 2));
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
