// filename: examples/save/basic.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { tables, Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>();

  const user = await db.save(tables.User, {
    id: "example-user-1", //if you omit this one will be generated for you when the schema has a UUID generator specified
    username: 'Example User',
    email: 'basic@example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Saved user:', user);  //Saved user: {id: 'example-user-1', username: 'Example User', email: 'basic@example.com', isActive: true, createdAt: '2025-08-27T01:47:29.655Z', …}
  if (!user || typeof (user as { id?: string }).id !== 'string') {
    throw new Error('Saved user did not return an id');
  }
  if ((user as { email?: string }).email !== 'basic@example.com') {
    throw new Error('Saved user email does not match input');
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
