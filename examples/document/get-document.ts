// filename: examples/document/get-document.ts
import process from 'node:process';
import { onyx } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();

  try {
    const doc = await db.getDocument('note.json');
    console.log('Document contents:', doc);
  } catch {
    console.log('Document not found.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
