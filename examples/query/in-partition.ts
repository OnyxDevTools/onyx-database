// filename: examples/query/in-partition.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>({requestLoggingEnabled: true});

  await db.save(tables.AuditLog, {
    tenantId: 'tenantA',
    dateTime: new Date(),
    action: 'LOGIN',
    status: 'SUCCESS',
  });

  const tenantLogs = await db
    .from(tables.AuditLog)
    .inPartition('tenantA')
    .list();

  console.log(JSON.stringify(tenantLogs, null, 2));
  /*
    [
      {
        "id": "log-1",
        "action": "LOGIN",
        "status": "SUCCESS"
      }
    ]
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
