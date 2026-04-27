import { onyx, type AiChatCompletionResponse } from '@onyx.dev/onyx-database';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === 'string') return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '';
}

function isRetryableAiError(error: unknown): boolean {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: unknown }).status
      : undefined;
  const bodyError =
    typeof error === 'object' && error !== null && 'body' in error
      ? (error as { body?: { error?: unknown } }).body?.error
      : undefined;
  const detail = [getErrorMessage(error), typeof bodyError === 'string' ? bodyError : '']
    .join(' ')
    .toLowerCase();

  return (
    (typeof status === 'number' && [408, 429, 500, 502, 503, 504].includes(status)) ||
    detail.includes('timeout') ||
    detail.includes('timed out')
  );
}

async function createChatCompletionWithRetry(
  db: ReturnType<typeof onyx.init>,
  attempts = 4,
): Promise<AiChatCompletionResponse> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await db.ai.chat({
        model: process.env.ONYX_DEFAULT_MODEL ?? 'onyx',
        messages: [{ role: 'user', content: 'Reply with exactly one short greeting sentence.' }],
        temperature: 0,
      });
    } catch (error) {
      const shouldRetry = isRetryableAiError(error) && attempt < attempts - 1;
      if (!shouldRetry) throw error;
      const delayMs = 1000 * 2 ** attempt;
      console.warn(`[ai/chat] transient AI error; retrying in ${delayMs}ms (attempt ${attempt + 2}/${attempts})`);
      await sleep(delayMs);
    }
  }

  throw new Error('Chat completion failed after retries');
}

async function main(): Promise<void> {
  const db = onyx.init();

  const completion = await createChatCompletionWithRetry(db);

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
