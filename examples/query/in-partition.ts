// filename: examples/query/in-partition.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  await db.save(tables.AuditLog, {
    id: 'audit-id-a',
    tenantId: 'tenantA',
    dateTime: new Date(),
    action: 'LOGIN',
    status: 'SUCCESS',
  });

  await db.save(tables.AuditLog, {
    id: 'audit-id-b',
    tenantId: 'tenantB',
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
        "id": "64bc1ff2-8a9d-11f0-0000-af8883148268",
        ...
        "tenantId": "tenantA"
      },
      {
        "id": "audit-id-a",
        ...
        "tenantId": "tenantA"
      }
    ]
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
