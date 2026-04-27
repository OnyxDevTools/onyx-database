import { type IOnyxDatabase } from '@onyx.dev/onyx-database';
import { tables, type Schema, type User } from '../onyx/types';

export async function sleep(ms: number): Promise<void> {
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

function isRetryableWriteError(error: unknown): boolean {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: unknown }).status
      : undefined;
  const retryable =
    typeof error === 'object' && error !== null && 'body' in error
      ? (error as { body?: { retryable?: unknown } }).body?.retryable
      : undefined;
  const detail = getErrorMessage(error).toLowerCase();

  return (
    retryable === true ||
    (typeof status === 'number' && [408, 429, 500, 502, 503, 504, 524].includes(status)) ||
    detail.includes('timeout') ||
    detail.includes('timed out')
  );
}

function getRetryDelayMs(error: unknown, attempt: number): number {
  const retryAfter =
    typeof error === 'object' && error !== null && 'body' in error
      ? (error as { body?: { retry_after?: unknown } }).body?.retry_after
      : undefined;
  if (typeof retryAfter === 'number' && Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }
  return 2000 * 2 ** attempt;
}

export async function waitForUserState(
  db: IOnyxDatabase<Schema>,
  userId: string,
  predicate: (user: User | null) => boolean,
  attempts = 6,
  delayMs = 1000,
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const user = (await db.findById(tables.User, userId)) as User | null;
    if (predicate(user)) return true;
    if (attempt < attempts - 1) {
      await sleep(delayMs);
    }
  }
  return false;
}

export async function retryWriteOperation(
  db: IOnyxDatabase<Schema>,
  description: string,
  operation: () => Promise<unknown>,
  confirm: () => Promise<boolean>,
  attempts = 3,
): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      if (await confirm()) {
        return;
      }
      const shouldRetry = isRetryableWriteError(error) && attempt < attempts - 1;
      if (!shouldRetry) throw error;
      const delayMs = getRetryDelayMs(error, attempt);
      console.warn(
        `[stream/${description}] transient write error; retrying in ${delayMs}ms (attempt ${attempt + 2}/${attempts})`,
      );
      await sleep(delayMs);
    }
  }
}
