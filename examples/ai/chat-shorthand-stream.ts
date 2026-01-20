import { onyx } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();

  const stream = await db.chat('Stream a comma-separated list of three colors.', {
    stream: true,
    temperature: 0,
  });

  let chunkCount = 0;
  let content = '';

  for await (const chunk of stream) {
    chunkCount += 1;
    const first = chunk.choices?.[0];
    if (!first?.delta) {
      throw new Error('Streaming chunk delta is missing');
    }
    if (typeof first.delta.content === 'string') {
      content += first.delta.content;
    }
  }

  if (chunkCount === 0) {
    throw new Error('No streaming chunks received');
  }
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('No streamed content assembled');
  }

  console.log('streamed content:', trimmed);
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
