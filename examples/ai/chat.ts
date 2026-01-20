import { onyx } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();

  const completion = await db.chat().create({
    model: 'onyx-chat',
    messages: [{ role: 'user', content: 'Reply with exactly one short greeting sentence.' }],
    temperature: 0,
  });

  if (!completion.id || completion.object !== 'chat.completion') {
    throw new Error('Chat completion response is missing id or object');
  }
  if (!Array.isArray(completion.choices) || completion.choices.length === 0) {
    throw new Error('Chat completion returned no choices');
  }
  const choice = completion.choices[0];
  if (!choice.message?.content || choice.message.content.trim().length === 0) {
    throw new Error('Chat completion message content is empty');
  }

  console.log('chat content:', choice.message.content.trim());
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
