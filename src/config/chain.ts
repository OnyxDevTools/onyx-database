// filename: src/config/chain.ts
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

const gProcess = (globalThis as {
  process?: {
    versions?: { node?: string };
    env?: Record<string, string | undefined>;
    stderr?: { write?: (s: string) => void };
    cwd?: () => string;
  };
}).process;
const isNode = !!gProcess?.versions?.node;

// Optional debug logger — enable with ONYX_DEBUG=true (Node only)
const dbg = (...args: unknown[]): void => {
  if (gProcess?.env?.ONYX_DEBUG == "true") {
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
  if (!gProcess?.env) return {};
  const env = gProcess.env;
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

async function readProjectFile(databaseId?: string): Promise<Partial<OnyxConfig>> {
  if (!isNode) return {};
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const cwd = gProcess?.cwd?.() ?? '.';

  const tryRead = async (p: string): Promise<Partial<OnyxConfig>> => {
    const txt = await fs.readFile(p, 'utf8');
    const sanitized = txt.replace(/[\r\n]+/g, '');
    const json = dropUndefined<OnyxConfig>(JSON.parse(sanitized) as Partial<OnyxConfig>);
    dbg('project file:', p, '→', mask(json));
    return json;
  };

  if (databaseId) {
    const specific = path.resolve(cwd, `onyx-database-${databaseId}.json`);
    try {
      return await tryRead(specific);
    } catch {
      dbg('project file not found:', specific);
    }
  }

  const fallback = path.resolve(cwd, 'onyx-database.json');
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
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  };
  const readProfile = async (p: string): Promise<Partial<OnyxConfig>> => {
    try {
      const txt = await fs.readFile(p, 'utf8');
      const sanitized = txt.replace(/[\r\n]+/g, '');
      const json = dropUndefined<OnyxConfig>(JSON.parse(sanitized) as Partial<OnyxConfig>);
      dbg('home profile used:', p, '→', mask(json));
      return json;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new OnyxConfigError(`Failed to read ${p}: ${msg}`);
    }
  };

  if (databaseId) {
    const specific = `${dir}/onyx-database-${databaseId}.json`;
    if (await fileExists(specific)) return readProfile(specific);
    dbg('no specific profile:', specific);
  }

  const defaultInDir = `${dir}/onyx-database.json`;
  if (await fileExists(defaultInDir)) return readProfile(defaultInDir);
  dbg('no default profile in dir:', defaultInDir);

  const defaultInHome = `${home}/onyx-database.json`;
  if (await fileExists(defaultInHome)) return readProfile(defaultInHome);
  dbg('no home-root fallback:', defaultInHome);

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
      'Multiple ~/.onyx/onyx-database-*.json profiles found. Specify databaseId via env or provide ./onyx-database.json.'
    );
  }

  dbg('no usable home profiles found in', dir);
  return {};
}

async function readConfigPath(p: string): Promise<Partial<OnyxConfig>> {
  if (!isNode) return {};
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const cwd = gProcess?.cwd?.() ?? '.';
  const resolved = path.isAbsolute(p) ? p : path.resolve(cwd, p);
  try {
    const txt = await fs.readFile(resolved, 'utf8');
    const sanitized = txt.replace(/[\r\n]+/g, '');
    const json = dropUndefined<OnyxConfig>(JSON.parse(sanitized) as Partial<OnyxConfig>);
    dbg('config path:', resolved, '→', mask(json));
    return json;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new OnyxConfigError(`Failed to read ${resolved}: ${msg}`);
  }
}

/**
 * Resolve configuration using precedence:
 *   explicit config (highest) >
 *   env (when ONYX_DATABASE_ID matches) > project file > home profile
 *   When ONYX_CONFIG_PATH is set, only that file (plus explicit config) is used.
 */
export async function resolveConfig(input?: OnyxConfig): Promise<ResolvedConfig> {
  const configPath = gProcess?.env?.ONYX_CONFIG_PATH;
  const env = configPath ? {} : readEnv(input?.databaseId);
  const targetId = input?.databaseId ?? env.databaseId;

  const haveDbId = !!(input?.databaseId ?? env.databaseId);
  const haveApiKey = !!(input?.apiKey ?? env.apiKey);
  const haveApiSecret = !!(input?.apiSecret ?? env.apiSecret);

  let file: Partial<OnyxConfig> = {};
  let fileSource: string | undefined;
  if (configPath) {
    file = await readConfigPath(configPath);
    if (Object.keys(file).length) fileSource = 'env ONYX_CONFIG_PATH';
  } else if (!(haveDbId && haveApiKey && haveApiSecret)) {
    const project = await readProjectFile(targetId);
    if (Object.keys(project).length) {
      file = project;
      fileSource = 'project file';
    } else {
      const home = await readHomeProfile(targetId);
      file = home;
      if (Object.keys(home).length) fileSource = 'home profile';
    }
  }

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
    const sources = configPath
      ? [configPath, 'explicit config']
      : [
          'env (when ONYX_DATABASE_ID matches)',
          ...(isNode
            ? [
                './onyx-database-<databaseId>.json',
                './onyx-database.json',
                '~/.onyx/onyx-database-<databaseId>.json',
                '~/.onyx/onyx-database.json',
                '~/onyx-database.json',
              ]
            : []),
          'explicit config',
        ];
    throw new OnyxConfigError(
      `Missing required config: ${missing.join(', ')}. Sources: ${sources.join(', ')}`,
    );
  }

  const resolved: ResolvedConfig = { baseUrl, databaseId, apiKey, apiSecret, fetch: fetchImpl };
  const source = {
    databaseId: input?.databaseId
      ? 'explicit config'
      : env.databaseId
      ? 'env'
      : file.databaseId
      ? fileSource ?? 'file'
      : 'unknown',
    apiKey: input?.apiKey
      ? 'explicit config'
      : env.apiKey
      ? 'env'
      : file.apiKey
      ? fileSource ?? 'file'
      : 'unknown',
    apiSecret: input?.apiSecret
      ? 'explicit config'
      : env.apiSecret
      ? 'env'
      : file.apiSecret
      ? fileSource ?? 'file'
      : 'unknown',
  };
  dbg('credential source:', JSON.stringify(source));
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
