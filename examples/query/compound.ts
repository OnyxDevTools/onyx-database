// filename: examples/query/compound.ts
import process from 'node:process';
import { onyx, eq, startsWith } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const users = await db
    .from(tables.User)
    .where(
      eq('isActive', true)
        .and(
          startsWith('username', 'user_').or(startsWith('email', 'user_'))
        )
        .or(
          eq('role', 'admin').and(startsWith('email', 'admin'))
        ),
    )
    .list();

  console.log(JSON.stringify(users, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
