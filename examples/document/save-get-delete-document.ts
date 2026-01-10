// filename: examples/document/save-document.ts
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { onyx, type OnyxDocument } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();

  const newDoc: OnyxDocument = {
    documentId: 'note.json',
    path: '/notes/note.json',
    mimeType: 'application/json',
    content: Buffer.from(JSON.stringify({ message: 'hello' })).toString('base64'),
  };

  const savedDoc = await db.saveDocument(newDoc);
  console.log('Saved document:', savedDoc);

   try {
    const doc = await db.getDocument('note.json');
    console.log('Document contents:', doc);
  } catch {
    console.log('Document not found.');
  }

    await db.deleteDocument('note.json');

    try {
    const doc = await db.getDocument('note.json');
    console.log('oops document still exists:', doc);
  } catch {
    console.log('Document was deleted successfully');
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
