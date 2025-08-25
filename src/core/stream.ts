// filename: src/core/stream.ts
import type { FetchImpl, StreamAction } from '../types/common';
import { OnyxHttpError } from '../errors/http-error';
import { parseJsonAllowNaN } from './http';

export interface StreamHandlers<T = unknown> {
  onItemAdded?: (entity: T) => void;
  onItemUpdated?: (entity: T) => void;
  onItemDeleted?: (entity: T) => void;
  onItem?: (entity: T | null, action: StreamAction) => void;
}

export async function openJsonLinesStream<T = unknown>(
  fetchImpl: FetchImpl,
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
  handlers: StreamHandlers<T> = {},
): Promise<{ cancel: () => void }> {
  interface Reader {
    cancel(): void;
    read(): Promise<{ done: boolean; value?: Uint8Array }>;
  }
  interface StreamBody { getReader(): Reader; }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let canceled = false;
  let currentReader: Reader | null = null;

  const processLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let obj: unknown;
    try { obj = parseJsonAllowNaN(trimmed); } catch { return; }
    const action = (obj as { action?: StreamAction }).action;
    const entity = (obj as { entity?: T | null }).entity;
    if (action === 'CREATE') handlers.onItemAdded?.(entity as T);
    else if (action === 'UPDATE') handlers.onItemUpdated?.(entity as T);
    else if (action === 'DELETE') handlers.onItemDeleted?.(entity as T);
    if (action && action !== 'KEEP_ALIVE') handlers.onItem?.(entity ?? null, action);
  };

  const connect = async (): Promise<void> => {
    if (canceled) return;
    try {
      const res = await fetchImpl(url, {
        method: init.method ?? 'PUT',
        headers: init.headers ?? {},
        body: init.body,
      });
      if (!res.ok) {
        const raw = await res.text();
        let parsed: unknown = raw;
        try { parsed = parseJsonAllowNaN(raw); } catch { /* ignore */ }
        throw new OnyxHttpError(`${res.status} ${res.statusText}`, res.status, res.statusText, parsed);
      }
      const body = (res as { body?: StreamBody }).body;
      if (!body || typeof body.getReader !== 'function') return;
      currentReader = body.getReader();
      pump();
    } catch {
      if (canceled) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      void connect();
    }
  };

  const pump = (): void => {
    if (canceled || !currentReader) return;
    currentReader
      .read()
      .then(({ done, value }) => {
        if (canceled) return;
        if (done) {
          void connect();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) processLine(line);
        pump();
      })
      .catch(() => {
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
