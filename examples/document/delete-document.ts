// filename: examples/document/delete-document.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();

  await db.deleteDocument('note.json');
  console.log('Document deleted (no-op if it did not exist).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
