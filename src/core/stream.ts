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
    if (!trimmed || trimmed.startsWith(':')) return;
    const jsonLine = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
    let obj: unknown;
    try {
      obj = parseJsonAllowNaN(jsonLine);
    } catch {
      return;
    }
    const rawAction =
      (obj as {
        action?: string;
        event?: string;
        type?: string;
        eventType?: string;
        changeType?: string;
      }).action ??
      (obj as {
        action?: string;
        event?: string;
        type?: string;
        eventType?: string;
        changeType?: string;
      }).event ??
      (obj as {
        action?: string;
        event?: string;
        type?: string;
        eventType?: string;
        changeType?: string;
      }).type ??
      (obj as {
        action?: string;
        event?: string;
        type?: string;
        eventType?: string;
        changeType?: string;
      }).eventType ??
      (obj as {
        action?: string;
        event?: string;
        type?: string;
        eventType?: string;
        changeType?: string;
      }).changeType;
    const entity = (obj as { entity?: T | null }).entity;
    const action = rawAction?.toUpperCase();
    if (
      action === 'CREATE' ||
      action === 'CREATED' ||
      action === 'ADDED' ||
      action === 'ADD' ||
      action === 'INSERT' ||
      action === 'INSERTED'
    )
      handlers.onItemAdded?.(entity as T);
    else if (action === 'UPDATE' || action === 'UPDATED')
      handlers.onItemUpdated?.(entity as T);
    else if (action === 'DELETE' || action === 'DELETED' || action === 'REMOVE' || action === 'REMOVED')
      handlers.onItemDeleted?.(entity as T);
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
          : action === 'DELETED' || action === 'DELETE' || action === 'REMOVE' || action === 'REMOVED'
            ? 'DELETE'
            : action;
    if (canonical && canonical !== 'KEEP_ALIVE')
      handlers.onItem?.(entity ?? null, canonical as StreamAction);
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
