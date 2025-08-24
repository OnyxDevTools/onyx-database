// filename: src/config/chain.ts
import process from 'node:process';
import { DEFAULT_BASE_URL, sanitizeBaseUrl } from './defaults';
import { OnyxConfigError } from '../errors/config-error';
import type { OnyxConfig } from '../types/public';
import type { FetchImpl } from '../types/common';

export interface ResolvedConfig {
  baseUrl: string;
  databaseId: string;
  apiKey: string;
  apiSecret: string;
  fetch: FetchImpl;
}

const isNode = typeof process !== 'undefined' && !!process.versions?.node;

// Optional debug logger — enable with ONYX_DEBUG=1
const dbg = (...args: unknown[]) => {
  if (isNode && process.env?.ONYX_DEBUG) {
    process.stderr.write(`[onyx-config] ${args.map(String).join(' ')}\n`);
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
  if (!isNode) return {};
  const env = process.env ?? {};
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = env[k];
      if (typeof v === 'string' && v.trim() !== '') return v.trim();
    }
    return undefined;
  };

  const envId = pick('ONYX_DATABASE_ID', 'NEXT_ONYX_DATABASE_ID');
  if (targetId && envId && targetId !== envId) return {};
  const databaseId = targetId ?? envId;
  if (!databaseId) return {};

  // IMPORTANT: only return defined keys so we don't override file values with `undefined`.
  const res = dropUndefined<OnyxConfig>({
    baseUrl: pick('ONYX_DATABASE_BASE_URL', 'NEXT_ONYX_DATABASE_BASE_URL'),
    databaseId,
    apiKey: pick('ONYX_DATABASE_API_KEY', 'NEXT_ONYX_DATABASE_API_KEY'),
    apiSecret: pick('ONYX_DATABASE_API_SECRET', 'NEXT_ONYX_DATABASE_API_SECRET'),
  });

  dbg('env:', mask(res));
  return res;
}

async function readProjectFile(databaseId?: string): Promise<Partial<OnyxConfig>> {
  if (!isNode) return {};
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  const tryRead = async (p: string): Promise<Partial<OnyxConfig>> => {
    const txt = await fs.readFile(p, 'utf8');
    const json = dropUndefined<OnyxConfig>(JSON.parse(txt) as Partial<OnyxConfig>);
    dbg('project file:', p, '→', mask(json));
    return json;
  };

  if (databaseId) {
    const specific = path.resolve(process.cwd(), `onyx-database-${databaseId}.json`);
    try {
      return await tryRead(specific);
    } catch {
      dbg('project file not found:', specific);
    }
  }

  const fallback = path.resolve(process.cwd(), 'onyx-database.json');
  try {
    return await tryRead(fallback);
  } catch {
    dbg('project file not found:', fallback);
    return {};
  }
}

async function readHomeProfile(databaseId?: string): Promise<Partial<OnyxConfig>> {
  if (!isNode) return {};
  const fs = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');

  const home = os.homedir();
  const dir = path.join(home, '.onyx');

  const fileExists = async (p: string): Promise<boolean> => {
    try { await fs.access(p); return true; } catch { return false; }
  };
  const readProfile = async (p: string): Promise<Partial<OnyxConfig>> => {
    try {
      const txt = await fs.readFile(p, 'utf8');
      const json = dropUndefined<OnyxConfig>(JSON.parse(txt) as Partial<OnyxConfig>);
      dbg('home profile used:', p, '→', mask(json));
      return json;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new OnyxConfigError(`Failed to read ${p}: ${msg}`);
    }
  };

  // 1) Specific profile by ID: ~/.onyx/onyx-database-<id>.json
  if (databaseId) {
    const specific = `${dir}/onyx-database-${databaseId}.json`;
    if (await fileExists(specific)) return readProfile(specific);
    dbg('no specific profile:', specific);
  }

  // 2) Default profile in ~/.onyx without suffix
  const defaultInDir = `${dir}/onyx-database.json`;
  if (await fileExists(defaultInDir)) return readProfile(defaultInDir);
  dbg('no default profile in dir:', defaultInDir);

  // 3) Home-root fallback: ~/onyx-database.json
  const defaultInHomeRoot = `${home}/onyx-database.json`;
  if (await fileExists(defaultInHomeRoot)) return readProfile(defaultInHomeRoot);
  dbg('no home-root fallback:', defaultInHomeRoot);

  // 4) Scan ~/.onyx for exactly one suffixed profile
  if (!(await fileExists(dir))) {
    dbg('~/.onyx does not exist:', dir);
    return {};
  }
  const files = await fs.readdir(dir).catch(() => []);
  const matches = files.filter(f => f.startsWith('onyx-database-') && f.endsWith('.json'));
  if (matches.length === 1) {
    const only = `${dir}/${matches[0]}`;
    return readProfile(only);
  }
  if (matches.length > 1) {
    throw new OnyxConfigError(
      'Multiple ~/.onyx/onyx-database-*.json profiles found. ' +
      'Specify databaseId via env or provide ./onyx-database.json.'
    );
  }

  dbg('no usable home profiles found in', dir);
  return {};
}

/**
 * Resolve configuration using precedence:
 *   explicit config (highest) > env (when ONYX_DATABASE_ID matches)
 *   > project file > home profile (lowest)
 * Project file supports:
 *   - ./onyx-database-<databaseId>.json
 *   - ./onyx-database.json
 * Home profile supports:
 *   - ~/.onyx/onyx-database-<databaseId>.json
 *   - ~/.onyx/onyx-database.json
 *   - ~/onyx-database.json
 *   - or a single ~/.onyx/onyx-database-*.json if unique
 */
export async function resolveConfig(input?: OnyxConfig): Promise<ResolvedConfig> {
  const targetId = input?.databaseId;
  const env = readEnv(targetId);
  let file: Partial<OnyxConfig> = {};
  if (!env.apiKey || !env.apiSecret) {
    const project = await readProjectFile(targetId);
    if (Object.keys(project).length) {
      file = project;
    } else {
      file = await readHomeProfile(targetId);
    }
  }

  // IMPORTANT: drop undefined keys for every layer before merging.
  const merged: Partial<OnyxConfig> = {
    baseUrl: DEFAULT_BASE_URL,
    ...dropUndefined<OnyxConfig>(file),
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

  const missing: string[] = [];
  if (!databaseId) missing.push('databaseId');
  if (!apiKey) missing.push('apiKey');
  if (!apiSecret) missing.push('apiSecret');
  if (missing.length) {
    dbg('validation failed. merged:', mask(merged));
    throw new OnyxConfigError(
      `Missing required config: ${missing.join(', ')}. ` +
        `Sources: env (when ONYX_DATABASE_ID matches), ` +
        `./onyx-database-<databaseId>.json, ./onyx-database.json, ` +
        `~/.onyx/onyx-database-<databaseId>.json, ~/.onyx/onyx-database.json, ~/onyx-database.json`
    );
  }

  const resolved: ResolvedConfig = { baseUrl, databaseId, apiKey, apiSecret, fetch: fetchImpl };
  dbg('resolved:', mask(resolved));
  return resolved;
}

// Redacts secrets for debug logging
function mask<T extends object>(obj: T | undefined): T | undefined {
  if (!obj) return obj;
  const clone = { ...(obj as Record<string, unknown>) } as Record<string, unknown>;
  if (typeof clone.apiKey === 'string') clone.apiKey = '***';
  if (typeof clone.apiSecret === 'string') clone.apiSecret = '***';
  return clone as unknown as T;
}
