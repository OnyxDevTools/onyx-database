import process from 'node:process';
import { onyx, eq } from '@onyx.dev/onyx-database';
import { tables, Schema } from '../onyx/types';

// Streams query results in manageable chunks. Useful when
// the result set is too large to fit in memory.
async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const stream = db
    .from(tables.User)
    // Only fetch active users.
    .where(eq('isActive', true))
    // Controls how many records the server sends per chunk.
    .pageSize(100)
    // Each query response record arrives through the onItem callback.
    .onItem((user, action) => {
      if (action === 'QUERY_RESPONSE' && user) {
        console.log('USER', user);
      }
    });

  // includeQueryResults=true streams the initial query results
  // keepAlive=false closes the stream after all results are sent
  const handle = await stream.stream(true, false);

  // Wait a moment to ensure all chunks are processed then cancel
  setTimeout(() => handle.cancel(), 1000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
