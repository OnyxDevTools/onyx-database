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
    .table();

  console.log(output);

  if (!output.includes('firstName') || !output.includes('address')) {
    throw new Error('Expected table formatter headers');
  }
  if (!output.includes('city=Del Mar') || !output.includes('state=CA') || !output.includes('country=USA')) {
    throw new Error('Expected inline nested address output');
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
