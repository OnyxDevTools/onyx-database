// filename: examples/query/lucine-search-all-tables.ts
// Learn how to search across all tables with db.search().

import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();
  const id = randomUUID();
  const luceneQuery = `"customer success" AND ${id}`;

  // Seed a record so ALL-table search always has a match (two lines: create, save).
  await db.save(tables.User, {
    id,
    username: `Jordan Taylor - Customer Success (${id})`,
    email: `jordan.${id}@example.com`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    lastLoginAt: null,
  });

  // Search across all tables; results include entity metadata
  const allTables = await db.search(luceneQuery).limit(1).firstOrNull();
  const first = (allTables as any)?.entity ?? allTables;

  if (!first || first.id !== id) {
    throw new Error('Expected ALL-table search (minScore null) to return the seeded user.');
  }

  console.log('ALL tables search (minScore null):', JSON.stringify(first, null, 2));
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
