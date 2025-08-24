// filename: examples/document/save-document.ts
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { onyx, type OnyxDocument } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();

  const doc: OnyxDocument = {
    documentId: 'note.json',
    path: '/notes/note.json',
    mimeType: 'application/json',
    content: Buffer.from(JSON.stringify({ message: 'hello' })).toString('base64'),
  };

  const meta = await db.saveDocument(doc);
  console.log('Saved document:', meta);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
