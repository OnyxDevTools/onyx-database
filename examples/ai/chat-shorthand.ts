import { onyx } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();

  const content = await db.chat('Reply with exactly one short greeting sentence.');

  if (!content || content.trim().length === 0) {
    throw new Error('Chat completion content is empty');
  }

  console.log('chat content:', content.trim());
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
