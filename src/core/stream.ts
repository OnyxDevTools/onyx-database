// filename: src/core/stream.ts
import type { FetchImpl, StreamAction } from '../types/common';
import { OnyxHttpError } from '../errors/http-error';
import { parseJsonAllowNaN } from './http';
import {
  decodeMessagePack,
  decodeMessagePackPrefix,
  isMessagePackContentType,
  MessagePackError,
} from './msgpack';

const debug = (...args: unknown[]): void => {
  if ((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.ONYX_STREAM_DEBUG == "true")
    console.log('[onyx-stream]', ...args);
};

export interface StreamHandlers<T = unknown> {
  onItemAdded?: (entity: T) => void;
  onItemUpdated?: (entity: T) => void;
  onItemDeleted?: (entity: T) => void;
  onItem?: (entity: T | null, action: StreamAction) => void;
}

interface StreamReader {
  cancel(): void;
  read(): Promise<{ done: boolean; value?: Uint8Array }>;
}

interface StreamBody {
  getReader(): StreamReader;
}

function dispatchStreamValue<T>(obj: unknown, handlers: StreamHandlers<T>): void {
  const event = obj as {
    action?: string;
    event?: string;
    type?: string;
    eventType?: string;
    changeType?: string;
    entity?: T | null;
  };
  const action = (
    event.action ?? event.event ?? event.type ?? event.eventType ?? event.changeType
  )?.toUpperCase();
  const entity = event.entity;
  if (
    action === 'CREATE' ||
    action === 'CREATED' ||
    action === 'ADDED' ||
    action === 'ADD' ||
    action === 'INSERT' ||
    action === 'INSERTED'
  ) {
    handlers.onItemAdded?.(entity as T);
  } else if (action === 'UPDATE' || action === 'UPDATED') {
    handlers.onItemUpdated?.(entity as T);
  } else if (
    action === 'DELETE' ||
    action === 'DELETED' ||
    action === 'REMOVE' ||
    action === 'REMOVED'
  ) {
    handlers.onItemDeleted?.(entity as T);
  }
  const canonical =
    action === 'ADDED' ||
    action === 'ADD' ||
    action === 'CREATE' ||
    action === 'CREATED' ||
    action === 'INSERT' ||
    action === 'INSERTED'
      ? 'CREATE'
      : action === 'UPDATED' || action === 'UPDATE'
        ? 'UPDATE'
        : action === 'DELETED' ||
            action === 'DELETE' ||
            action === 'REMOVE' ||
            action === 'REMOVED'
          ? 'DELETE'
          : action;
  if (canonical && canonical !== 'KEEP_ALIVE') {
    handlers.onItem?.(entity ?? null, canonical as StreamAction);
  }
  debug('dispatch', canonical, entity);
}

function processJsonLine<T>(line: string, handlers: StreamHandlers<T>): void {
  const trimmed = line.trim();
  debug('line', trimmed);
  if (!trimmed || trimmed.startsWith(':')) return;
  const jsonLine = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
  let value: unknown;
  try {
    value = parseJsonAllowNaN(jsonLine);
  } catch {
    // Ignore malformed lines and continue consuming the stream.
    return;
  }
  dispatchStreamValue(value, handlers);
}

export async function openJsonLinesStream<T = unknown>(
  fetchImpl: FetchImpl,
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
  handlers: StreamHandlers<T> = {},
): Promise<{ cancel: () => void }> {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let canceled = false;
  let currentReader: StreamReader | null = null;
  let retryCount = 0;
  const maxRetries = 4;

  const processLine = (line: string): void => {
    processJsonLine(line, handlers);
  };

  const connect = async (): Promise<void> => {
    if (canceled) return;
    debug('connecting', url);
    try {
      const res = await fetchImpl(url, {
        method: init.method ?? 'PUT',
        headers: init.headers ?? {},
        body: init.body,
      });
      debug('response', res.status, res.statusText);
      if (!res.ok) {
        const raw = await res.text();
        let parsed: unknown = raw;
        try { parsed = parseJsonAllowNaN(raw); } catch { /* ignore */ }
        debug('non-ok', res.status);
        throw new OnyxHttpError(`${res.status} ${res.statusText}`, res.status, res.statusText, parsed, raw);
      }
      const body = (res as { body?: StreamBody }).body;
      if (!body || typeof body.getReader !== 'function') {
        debug('no reader');
        return;
      }
      currentReader = body.getReader();
      debug('connected');
      retryCount = 0;
      pump();
    } catch (err) {
      debug('connect error', err);
      if (canceled) return;
      if (retryCount >= maxRetries) return;
      const delay = Math.min(1000 * 2 ** retryCount, 30000);
      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, delay));
      void connect();
    }
  };

  const pump = (): void => {
    if (canceled || !currentReader) return;
    currentReader
      .read()
      .then(({ done, value }) => {
        if (canceled) return;
        debug('chunk', { done, length: value?.length ?? 0 });
        if (done) {
          debug('done');
          void connect();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) processLine(line);
        pump();
      })
      .catch((err) => {
        debug('pump error', err);
        if (!canceled) void connect();
      });
  };

  await connect();

  return {
    cancel() {
      if (canceled) return;
      canceled = true;
      try { currentReader?.cancel(); } catch { /* ignore */ }
    }
  };
}

/**
 * Opens an entity stream whose successful response is either concatenated,
 * self-delimiting MessagePack values or a JSON-lines fallback.
 */
export async function openMessagePackStream<T = unknown>(
  fetchImpl: FetchImpl,
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: Uint8Array } = {},
  handlers: StreamHandlers<T> = {},
): Promise<{ cancel: () => void }> {
  let binaryBuffer = new Uint8Array(256);
  let binaryLength = 0;
  let textBuffer = '';
  let textDecoder = new TextDecoder('utf-8');
  let binaryResponse = true;
  let canceled = false;
  let currentReader: StreamReader | null = null;
  let retryCount = 0;
  const maxRetries = 4;

  const processBinaryChunk = (chunk: Uint8Array): void => {
    const required = binaryLength + chunk.byteLength;
    if (required > binaryBuffer.byteLength) {
      let capacity = binaryBuffer.byteLength;
      while (capacity < required) capacity *= 2;
      const expanded = new Uint8Array(capacity);
      expanded.set(binaryBuffer.subarray(0, binaryLength));
      binaryBuffer = expanded;
    }
    binaryBuffer.set(chunk, binaryLength);
    binaryLength = required;

    let consumed = 0;
    while (consumed < binaryLength) {
      try {
        const frame = decodeMessagePackPrefix(binaryBuffer.subarray(consumed, binaryLength));
        consumed += frame.bytesRead;
        // The server may send an initial nil frame to flush intermediary buffers.
        if (frame.value !== null) dispatchStreamValue(frame.value, handlers);
      } catch (error) {
        if (error instanceof MessagePackError && error.code === 'truncated') break;
        throw error;
      }
    }
    if (consumed > 0) {
      binaryBuffer.copyWithin(0, consumed, binaryLength);
      binaryLength -= consumed;
    }
  };

  const processTextChunk = (chunk: Uint8Array): void => {
    textBuffer += textDecoder.decode(chunk, { stream: true });
    const lines = textBuffer.split('\n');
    textBuffer = lines.pop() ?? '';
    for (const line of lines) processJsonLine(line, handlers);
  };

  const connect = async (): Promise<void> => {
    if (canceled) return;
    debug('connecting', url);
    try {
      const res = await fetchImpl(url, {
        method: init.method ?? 'PUT',
        headers: init.headers ?? {},
        body: init.body,
      });
      debug('response', res.status, res.statusText);
      const contentType = res.headers.get('Content-Type') ?? '';
      if (!res.ok) {
        let parsed: unknown;
        let raw: string;
        if (isMessagePackContentType(contentType)) {
          if (typeof res.arrayBuffer !== 'function') {
            throw new Error('MessagePack response requires FetchResponse.arrayBuffer()');
          }
          const bytes = new Uint8Array(await res.arrayBuffer());
          parsed = bytes.byteLength === 0 ? '' : decodeMessagePack(bytes);
          raw = bytes.byteLength === 0 ? '' : `<MessagePack ${bytes.byteLength} bytes>`;
        } else {
          raw = await res.text();
          parsed = raw;
          try {
            parsed = parseJsonAllowNaN(raw);
          } catch {
            // Preserve non-JSON error text.
          }
        }
        debug('non-ok', res.status);
        throw new OnyxHttpError(
          `${res.status} ${res.statusText}`,
          res.status,
          res.statusText,
          parsed,
          raw,
        );
      }
      const body = (res as { body?: StreamBody }).body;
      if (!body || typeof body.getReader !== 'function') {
        debug('no reader');
        return;
      }
      binaryResponse = isMessagePackContentType(contentType);
      binaryBuffer = new Uint8Array(256);
      binaryLength = 0;
      textBuffer = '';
      textDecoder = new TextDecoder('utf-8');
      currentReader = body.getReader();
      debug('connected', binaryResponse ? 'msgpack' : 'json');
      retryCount = 0;
      pump();
    } catch (error) {
      debug('connect error', error);
      if (canceled) return;
      if (retryCount >= maxRetries) return;
      const delay = Math.min(1000 * 2 ** retryCount, 30000);
      retryCount += 1;
      await new Promise((resolve) => setTimeout(resolve, delay));
      void connect();
    }
  };

  const pump = (): void => {
    if (canceled || !currentReader) return;
    currentReader
      .read()
      .then(({ done, value }) => {
        if (canceled) return;
        debug('chunk', { done, length: value?.length ?? 0 });
        if (done) {
          debug('done');
          void connect();
          return;
        }
        if (value) {
          if (binaryResponse) processBinaryChunk(value);
          else processTextChunk(value);
        }
        pump();
      })
      .catch((error) => {
        debug('pump error', error);
        if (!canceled) void connect();
      });
  };

  await connect();

  return {
    cancel() {
      if (canceled) return;
      canceled = true;
      try {
        currentReader?.cancel();
      } catch {
        // Ignore cancellation failures.
      }
    },
  };
}
