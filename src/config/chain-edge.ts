// filename: src/config/chain-edge.ts
import { DEFAULT_BASE_URL, sanitizeBaseUrl } from './defaults';
import { OnyxConfigError } from '../errors/config-error';
import type { OnyxConfig } from '../types/public';
import type { FetchImpl } from '../types/common';
import type { ResolvedConfig } from './types';

const gProcess = (globalThis as {
  process?: {
    env?: Record<string, string | undefined>;
    stderr?: { write?: (s: string) => void };
  };
}).process;

const dbg = (...args: unknown[]): void => {
  if (gProcess?.env?.ONYX_DEBUG == 'true') {
    const fmt = (v: unknown): string => {
      if (typeof v === 'string') return v;
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    };
    gProcess.stderr?.write?.(`[onyx-config] ${args.map(fmt).join(' ')}\n`);
  }
};

function dropUndefined<T extends object>(obj: Partial<T> | undefined): Partial<T> {
  if (!obj) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

function readEnv(targetId?: string): Partial<OnyxConfig> {
  const env = gProcess?.env;
  if (!env) return {};
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = env[k];
      if (typeof v === 'string') {
        const cleaned = v.replace(/[\r\n]+/g, '').trim();
        if (cleaned !== '') return cleaned;
      }
    }
    return undefined;
  };

  const envId = pick('ONYX_DATABASE_ID');
  if (targetId && envId !== targetId) return {};
  const res = dropUndefined<OnyxConfig>({
    baseUrl: pick('ONYX_DATABASE_BASE_URL'),
    databaseId: envId,
    apiKey: pick('ONYX_DATABASE_API_KEY'),
    apiSecret: pick('ONYX_DATABASE_API_SECRET'),
  });
  if (Object.keys(res).length === 0) return {};
  dbg('env:', mask(res));
  return res;
}

export async function resolveConfig(input?: OnyxConfig): Promise<ResolvedConfig> {
  const configPath = gProcess?.env?.ONYX_CONFIG_PATH;
  if (configPath) {
    throw new OnyxConfigError(
      'ONYX_CONFIG_PATH is not supported in edge runtimes. Provide env vars or explicit config.',
    );
  }

  const env = readEnv(input?.databaseId);
  const merged: Partial<OnyxConfig> = {
    baseUrl: DEFAULT_BASE_URL,
    ...dropUndefined<OnyxConfig>(env),
    ...dropUndefined<OnyxConfig>(input),
  };

  dbg('merged (pre-validate):', mask(merged));

  const baseUrl = sanitizeBaseUrl(merged.baseUrl ?? DEFAULT_BASE_URL);
  const databaseId = merged.databaseId ?? '';
  const apiKey = merged.apiKey ?? '';
  const apiSecret = merged.apiSecret ?? '';
  const gfetch = (globalThis as { fetch?: FetchImpl }).fetch;
  const fetchImpl: FetchImpl =
    merged.fetch ??
    (typeof gfetch === 'function'
      ? (u, i) => gfetch(u, i)
      : async () => {
          throw new OnyxConfigError('No fetch available; provide OnyxConfig.fetch');
        });
  const retryConfig = merged.retry ?? {};
  const retryEnabled = retryConfig.enabled ?? true;
  const maxRetries = retryConfig.maxRetries ?? 3;
  const retryInitialDelayMs = retryConfig.initialDelayMs ?? 300;

  const missing: string[] = [];
  if (!databaseId) missing.push('databaseId');
  if (!apiKey) missing.push('apiKey');
  if (!apiSecret) missing.push('apiSecret');
  if (missing.length) {
    dbg('validation failed. merged:', mask(merged));
    const sources = ['env', 'explicit config'];
    throw new OnyxConfigError(
      `Missing required config: ${missing.join(', ')}. Sources: ${sources.join(', ')}`,
    );
  }

  const resolved: ResolvedConfig = {
    baseUrl,
    databaseId,
    apiKey,
    apiSecret,
    fetch: fetchImpl,
    retryEnabled,
    maxRetries,
    retryInitialDelayMs,
  };
  dbg('resolved:', mask(resolved));
  return resolved;
}

// Redacts secrets for debug logging
function mask<T extends object>(obj: T): T {
  const clone = { ...(obj as Record<string, unknown>) } as Record<string, unknown>;
  if (typeof clone.apiKey === 'string') clone.apiKey = '***';
  if (typeof clone.apiSecret === 'string') clone.apiSecret = '***';
  return clone as unknown as T;
}
