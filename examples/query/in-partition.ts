// filename: examples/query/in-partition.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>({ requestLoggingEnabled: true });

  await db.save(tables.User, {});

  const tenantUsers = await db
    .from(tables.User)
    .inPartition('tenantA')
    .list();

  console.log(JSON.stringify(tenantUsers, null, 2));
  /*
    [
      {
        "id": "tenantA-user-1",
        "email": "a@example.com"
      }
    ]
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
