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
    .tree({
      rootLabel: 'profiles',
      keyField: 'firstName',
    });

  console.log(output);

  if (!output.includes('profiles') || !output.includes('address')) {
    throw new Error('Expected tree formatter output');
  }
  if (!output.includes('city: Del Mar')) {
    throw new Error('Expected nested address tree nodes');
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
