import process from 'node:process';
import { eq, onyx } from '@onyx.dev/onyx-database';
import { Schema, tables } from 'onyx/types';

const formatterExampleBio = 'Seeded admin profile for formatter examples';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const output = await db
    .from(tables.UserProfile)
    .select('firstName', 'lastName', 'address')
    .where(eq('bio', formatterExampleBio))
    .limit(1)
    .json();

  console.log(output);

  const parsed = JSON.parse(output) as Array<Record<string, unknown>>;
  const address = parsed[0]?.address as Record<string, unknown> | undefined;
  if (address?.city !== 'Del Mar' || address?.state !== 'CA' || address?.country !== 'USA') {
    throw new Error('Expected nested address object in JSON output');
  }
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
