// filename: examples/query/lucine-search-all-tables-min-score.ts
// Search across all tables with an explicit minScore.

import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();
  const id = randomUUID();
  const luceneQuery = `"customer success" AND ${id}`;

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

  const scored = await db.search(luceneQuery, 4.4).limit(5).list();
  const hit = (scored[0] as any)?.entity ?? scored[0];

  if (!hit || hit.id !== id) {
    throw new Error('Expected ALL-table search (minScore 4.4) to return the seeded user.');
  }

  console.log('ALL tables search (minScore 4.4):', JSON.stringify(hit, null, 2));
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
