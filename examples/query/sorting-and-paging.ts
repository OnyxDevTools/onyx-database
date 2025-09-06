// filename: examples/query/sorting-and-paging.ts
import process from 'node:process';
import { onyx, desc } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const firstPage = await db
    .from(tables.User)
    .orderBy(desc('username'))
    .page({ pageSize: 2 });

  console.log('Page 1:', firstPage.records.map(u => u.username));

  if (firstPage.nextPage) {
    const secondPage = await db
      .from(tables.User)
      .orderBy(desc('username'))
      .nextPage(firstPage.nextPage)
      .page({ pageSize: 2 });
    console.log('Page 2:', secondPage.records.map(u => u.username));
  }

  /*
    Page 1: (2) ['user_97b12fbd', 'user_95f64f46']
    Page 2: (2) ['user_70a7850b', 'user_649db1b4']
  */
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
