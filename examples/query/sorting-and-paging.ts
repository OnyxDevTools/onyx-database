// filename: examples/query/sorting-and-paging.ts
import process from 'node:process';
import { onyx, desc, startsWith } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();
  const prefix = `paging-example-${Date.now()}`;
  const usernames = ['01', '02', '03', '04', '05'].map((suffix) => `${prefix}-${suffix}`);

  await db.save(
    tables.User,
    usernames.map((username, index) => ({
      id: `${username}-id`,
      username,
      email: `${username}@example.com`,
      isActive: true,
      lastLoginAt: null,
      deletedAt: null,
    })),
  );

  const firstPage = await db
    .from(tables.User)
    .where(startsWith('username', prefix))
    .orderBy(desc('username'))
    .page({ pageSize: 2 });

  console.log('Page 1:', firstPage.records.map(u => u.username));

  if (firstPage.records.length !== 2) {
    throw new Error(`Expected 2 records on page 1, received ${firstPage.records.length}`);
  }
  if (!firstPage.nextPage) {
    throw new Error('Expected a nextPage token for page 1');
  }

  const secondPage = await db
    .from(tables.User)
    .where(startsWith('username', prefix))
    .orderBy(desc('username'))
    .nextPage(firstPage.nextPage)
    .page({ pageSize: 2 });

  console.log('Page 2:', secondPage.records.map(u => u.username));

  if (secondPage.records.length !== 2) {
    throw new Error(`Expected 2 records on page 2, received ${secondPage.records.length}`);
  }
  if (!secondPage.nextPage) {
    throw new Error('Expected a nextPage token for page 2');
  }

  const thirdPage = await db
    .from(tables.User)
    .where(startsWith('username', prefix))
    .orderBy(desc('username'))
    .nextPage(secondPage.nextPage)
    .page({ pageSize: 2 });

  console.log('Page 3:', thirdPage.records.map(u => u.username));

  if (thirdPage.records.length !== 1) {
    throw new Error(`Expected 1 record on page 3, received ${thirdPage.records.length}`);
  }
  if (thirdPage.nextPage) {
    throw new Error('Expected page 3 to be the final page');
  }

  const seen = [
    ...firstPage.records.map(u => u.username),
    ...secondPage.records.map(u => u.username),
    ...thirdPage.records.map(u => u.username),
  ];
  const expected = [...usernames].sort().reverse();

  if (seen.length !== expected.length) {
    throw new Error(`Expected ${expected.length} paged records, received ${seen.length}`);
  }
  if (seen.join('|') !== expected.join('|')) {
    throw new Error(`Expected paged order ${expected.join(', ')}, received ${seen.join(', ')}`);
  }

  /*
    Page 1: ['paging-example-...-05', 'paging-example-...-04']
    Page 2: ['paging-example-...-03', 'paging-example-...-02']
    Page 3: ['paging-example-...-01']
  */
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
