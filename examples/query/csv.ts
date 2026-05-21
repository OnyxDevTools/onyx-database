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
    .csv();

  console.log(output);

  const [headerLine, valueLine] = output.split('\n');
  const headers = headerLine?.split(',') ?? [];
  const values = valueLine?.split(',') ?? [];
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));

  if (!headers.includes('address.city') || !headers.includes('address.state') || !headers.includes('address.country')) {
    throw new Error('Expected flattened nested address columns');
  }
  if (row['address.city'] !== 'Del Mar' || row['address.state'] !== 'CA' || row['address.country'] !== 'USA') {
    throw new Error('Expected flattened nested address values');
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
