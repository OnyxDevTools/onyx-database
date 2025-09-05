// filename: examples/query/compound.ts
import process from 'node:process';
import { onyx, eq, startsWith, desc, notNull } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';
import { seedAuditLogs } from 'seed';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  seedAuditLogs()

  const logs = await db
    .from(tables.AuditLog)
    .where(
      eq('actorId', 'admin-user-1')
        .and(eq('action', 'DELETE').or(eq('action', 'UPDATE')))
        .or(
          notNull('actorId')
          .and(eq("status", "FAILURE"))
          .and(eq('targetId', 'entity-6'))
        ),
    )
    .orderBy(desc('dateTime'))
    .list();

  console.log(JSON.stringify(logs, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
