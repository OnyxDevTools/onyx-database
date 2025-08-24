// filename: src/core/stream.ts
import type { FetchImpl } from '../types/common';
import { OnyxHttpError } from '../errors/http-error';
import { parseJsonAllowNaN } from './http';
import type { StreamAction } from '../types/common';

export type StreamHandlers<T = unknown> = {
  onItemAdded?: (entity: T) => void;
  onItemUpdated?: (entity: T) => void;
  onItemDeleted?: (entity: T) => void;
  onItem?: (entity: T | null, action: StreamAction) => void;
};

export async function openJsonLinesStream<T = unknown>(
  fetchImpl: FetchImpl,
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
  handlers: StreamHandlers<T> = {}
): Promise<{ cancel: () => void }> {
  const res = await fetchImpl(url, {
    method: init.method ?? 'PUT',
    headers: init.headers ?? {},
    body: init.body
  });

  if (!res.ok) {
    const raw = await res.text();
    let parsed: unknown = raw;
    try { parsed = parseJsonAllowNaN(raw); } catch { /* ignore */ }
    throw new OnyxHttpError(`${res.status} ${res.statusText}`, res.status, res.statusText, parsed);
  }

  const body: any = (res as any).body;
  if (!body || typeof body.getReader !== 'function') {
    // Not a stream; nothing to read
    return { cancel: () => { /* noop */ } };
  }

  const reader: any = body.getReader();
  const decoder: any = new (globalThis as any).TextDecoder('utf-8');
  let buffer = '';
  let canceled = false;

  const handle = {
    cancel() {
      if (canceled) return;
      canceled = true;
      try { reader.cancel(); } catch { /* ignore */ }
    }
  };

  const processLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let obj: any;
    try { obj = parseJsonAllowNaN(trimmed) as any; } catch { return; }
    const action = obj?.action as StreamAction | undefined;
    const entity = obj?.entity as T | null | undefined;

    if (action === 'CREATE') handlers.onItemAdded?.(entity as T);
    else if (action === 'UPDATE') handlers.onItemUpdated?.(entity as T);
    else if (action === 'DELETE') handlers.onItemDeleted?.(entity as T);
    if (action && action !== 'KEEP_ALIVE') handlers.onItem?.(entity ?? null, action);
  };

  const pump = (): void => {
    if (canceled) return;
    reader.read().then(({ done, value }: any) => {
      if (canceled || done) return;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) processLine(line);
      pump();
    }).catch(() => { /* ignore errors on read loop */ });
  };

  pump();
  return handle;
}