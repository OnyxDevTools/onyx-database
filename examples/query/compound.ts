// filename: examples/query/compound.ts
import process from 'node:process';
import { onyx, eq, startsWith } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const logs = await db
    .from(tables.AuditLog)
    .where(
      eq('status', 'FAILURE')
        .and(eq('action', 'DELETE').or(eq('action', 'UPDATE')))
        .or(
          eq('actorId', 'admin-user-1').and(startsWith('resource', 'User'))
        ),
    )
    .orderBy('dateTime', 'desc')
    .list();

  console.log(JSON.stringify(logs, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
