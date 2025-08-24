// filename: examples/init/basic.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';
import { Schema } from 'onyx/types';

async function main(): Promise<void> {
  const db = onyx.init<Schema>({
    project: 'demo',
    branch: 'main',
    token: 'test-token',
  });

  console.log('Initialized Onyx client:', typeof db);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
