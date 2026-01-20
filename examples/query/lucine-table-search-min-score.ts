// filename: examples/query/lucine-table-search-min-score.ts
// Table-specific Lucene search with an explicit minScore.

import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { desc, onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();
  const id = randomUUID();
  const luceneQuery = `"customer success" AND ${id}`;

  await db.save(tables.User, {
    id,
    username: `Casey Demo (${id}) - customer success manager`,
    email: `casey.${id}@example.com`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const matches = await db
    .from(tables.User)
    .search(luceneQuery, 4.4)
    .orderBy(desc('createdAt'))
    .limit(3)
    .list();

  const hit = matches.find((u) => u.id === id);
  if (!hit) {
    throw new Error('Expected table search (minScore 4.4) to return the seeded user.');
  }

  console.log('Table search (minScore 4.4):', JSON.stringify(matches, null, 2));
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
