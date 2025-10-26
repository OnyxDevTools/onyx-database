// filename: examples/query/compound.ts
import process from 'node:process';
import { onyx, eq, desc, notNull } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';
import { seedAuditLogs } from 'seed';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  await seedAuditLogs();

  const logs = await db
    .from(tables.AuditLog)
    .select("actorId", "action", "targetId", "status", "dateTime")
    .where(
      eq('actorId', 'admin-user-1')
        .and(eq('action', 'DELETE').or(eq('action', 'UPDATE')))
        .or(
          notNull('actorId')
          .and(eq("status", "FAILURE"))
          .and(eq('targetId', 'entity-6'))
        )
    )
    .orderBy(desc('dateTime'))
    .list();

  console.log(JSON.stringify(logs, null, 2));

  /*
    [
      {
        "dateTime": "2025-09-05T22:57:41.573Z",
        "actorId": "admin-user-1",
        "targetId": "entity-2",
        "action": "DELETE",
        "status": "SUCCESS"
      },
      {
        "dateTime": "2025-09-05T22:55:41.573Z",
        "actorId": "service",
        "targetId": "entity-6",
        "action": "GET",
        "status": "FAILURE"
      },
      {
        "dateTime": "2025-09-05T22:53:41.573Z",
        "actorId": "service",
        "targetId": "entity-6",
        "action": "UPDATE",
        "status": "FAILURE"
      }
    ]
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
