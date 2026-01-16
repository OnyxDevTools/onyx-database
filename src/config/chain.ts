// filename: src/config/chain.ts
import { DEFAULT_BASE_URL, sanitizeBaseUrl } from './defaults';
import { OnyxConfigError } from '../errors/config-error';
import type { OnyxConfig } from '../types/public';
import type { FetchImpl } from '../types/common';
import type { ConfigSourceInfo, ResolvedConfig } from './types';

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

// Lazy import helper to hide Node-only modules from bundlers
async function nodeImport<T>(spec: string): Promise<T> {
  return import(/* @vite-ignore */ spec) as Promise<T>;
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

async function readProjectFile(databaseId?: string): Promise<{ config: Partial<OnyxConfig>; path?: string }> {
  if (!isNode) return { config: {} };
  const fs = await nodeImport<typeof import('node:fs/promises')>('node:fs/promises');
  const path = await nodeImport<typeof import('node:path')>('node:path');
  const cwd = gProcess?.cwd?.() ?? '.';

  const tryRead = async (p: string): Promise<{ config: Partial<OnyxConfig>; path: string }> => {
    const txt = await fs.readFile(p, 'utf8');
    const sanitized = txt.replace(/[\r\n]+/g, '');
    const json = dropUndefined<OnyxConfig>(JSON.parse(sanitized) as Partial<OnyxConfig>);
    dbg('project file:', p, '→', mask(json));
    return { config: json, path: p };
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
    return { config: {} };
  }
}

async function readHomeProfile(databaseId?: string): Promise<{ config: Partial<OnyxConfig>; path?: string }> {
  if (!isNode) return { config: {} };
  const fs = await nodeImport<typeof import('node:fs/promises')>('node:fs/promises');
  const os = await nodeImport<typeof import('node:os')>('node:os');
  const path = await nodeImport<typeof import('node:path')>('node:path');

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
  const readProfile = async (p: string): Promise<{ config: Partial<OnyxConfig>; path: string }> => {
    try {
      const txt = await fs.readFile(p, 'utf8');
      const sanitized = txt.replace(/[\r\n]+/g, '');
      const json = dropUndefined<OnyxConfig>(JSON.parse(sanitized) as Partial<OnyxConfig>);
      dbg('home profile used:', p, '→', mask(json));
      return { config: json, path: p };
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
    return { config: {} };
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
  return { config: {} };
}

async function readConfigPath(p: string): Promise<{ config: Partial<OnyxConfig>; path?: string }> {
  if (!isNode) return { config: {} };
  const fs = await nodeImport<typeof import('node:fs/promises')>('node:fs/promises');
  const path = await nodeImport<typeof import('node:path')>('node:path');
  const cwd = gProcess?.cwd?.() ?? '.';
  const resolved = path.isAbsolute(p) ? p : path.resolve(cwd, p);
  try {
    const txt = await fs.readFile(resolved, 'utf8');
    const sanitized = txt.replace(/[\r\n]+/g, '');
    const json = dropUndefined<OnyxConfig>(JSON.parse(sanitized) as Partial<OnyxConfig>);
    dbg('config path:', resolved, '→', mask(json));
    return { config: json, path: resolved };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new OnyxConfigError(`Failed to read ${resolved}: ${msg}`);
  }
}

/**
 * Resolve configuration using precedence:
 *   explicit config (highest) >
 *   env vars >
 *   ONYX_CONFIG_PATH file >
 *   project file >
 *   home profile
 */
export async function resolveConfig(input?: OnyxConfig): Promise<ResolvedConfig> {
  const configPath = gProcess?.env?.ONYX_CONFIG_PATH;
  const env = readEnv(input?.databaseId);

  let cfgPath: Partial<OnyxConfig> = {};
  if (configPath) {
    const cfgRes = await readConfigPath(configPath);
    cfgPath = cfgRes.config;
  }

  const targetId = input?.databaseId ?? env.databaseId ?? cfgPath.databaseId;

  let haveDbId = !!(input?.databaseId ?? env.databaseId ?? cfgPath.databaseId);
  let haveApiKey = !!(input?.apiKey ?? env.apiKey ?? cfgPath.apiKey);
  let haveApiSecret = !!(input?.apiSecret ?? env.apiSecret ?? cfgPath.apiSecret);

  let project: Partial<OnyxConfig> = {};
  if (!(haveDbId && haveApiKey && haveApiSecret)) {
    const projRes = await readProjectFile(targetId);
    project = projRes.config;
    if (project.databaseId) haveDbId = true;
    if (project.apiKey) haveApiKey = true;
    if (project.apiSecret) haveApiSecret = true;
  }

  let home: Partial<OnyxConfig> = {};
  if (!(haveDbId && haveApiKey && haveApiSecret)) {
    const homeRes = await readHomeProfile(targetId);
    home = homeRes.config;
  }

  const merged: Partial<OnyxConfig> = {
    baseUrl: DEFAULT_BASE_URL,
    ...dropUndefined<OnyxConfig>(home),
    ...dropUndefined<OnyxConfig>(project),
    ...dropUndefined<OnyxConfig>(cfgPath),
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

  const retryConfig =
    input?.retry ??
    env.retry ??
    cfgPath.retry ??
    project.retry ??
    home.retry ??
    {};
  const retryEnabled = retryConfig.enabled ?? true;
  const maxRetries = retryConfig.maxRetries ?? 3;
  const retryInitialDelayMs = retryConfig.initialDelayMs ?? 300;

  const missing: string[] = [];
  if (!databaseId) missing.push('databaseId');
  if (!apiKey) missing.push('apiKey');
  if (!apiSecret) missing.push('apiSecret');
  if (missing.length) {
    dbg('validation failed. merged:', mask(merged));
    const sources = [
      'env',
      configPath ?? 'env ONYX_CONFIG_PATH',
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
  const source = {
    databaseId: input?.databaseId
      ? 'explicit config'
      : env.databaseId
      ? 'env'
      : cfgPath.databaseId
      ? 'env ONYX_CONFIG_PATH'
      : project.databaseId
      ? 'project file'
      : home.databaseId
      ? 'home profile'
      : 'unknown',
    apiKey: input?.apiKey
      ? 'explicit config'
      : env.apiKey
      ? 'env'
      : cfgPath.apiKey
      ? 'env ONYX_CONFIG_PATH'
      : project.apiKey
      ? 'project file'
      : home.apiKey
      ? 'home profile'
      : 'unknown',
    apiSecret: input?.apiSecret
      ? 'explicit config'
      : env.apiSecret
      ? 'env'
      : cfgPath.apiSecret
      ? 'env ONYX_CONFIG_PATH'
      : project.apiSecret
      ? 'project file'
      : home.apiSecret
      ? 'home profile'
      : 'unknown',
  };
  dbg('credential source:', JSON.stringify(source));
  dbg('resolved:', mask(resolved));
  return resolved;
}

export async function resolveConfigWithSource(
  input?: OnyxConfig,
): Promise<ResolvedConfig & { sources: ConfigSourceInfo }> {
  const configPathEnv = gProcess?.env?.ONYX_CONFIG_PATH;
  const env = readEnv(input?.databaseId);
  const cfgPathRes = configPathEnv ? await readConfigPath(configPathEnv) : { config: {} };
  const cfgPath = cfgPathRes.config;
  const projectRes = await readProjectFile(input?.databaseId ?? env.databaseId ?? cfgPath.databaseId);
  const project = projectRes.config;
  const homeRes = await readHomeProfile(input?.databaseId ?? env.databaseId ?? cfgPath.databaseId);
  const home = homeRes.config;

  const base = await resolveConfig(input);
  const sources: ConfigSourceInfo = {
    baseUrl: input?.baseUrl
      ? 'explicit config'
      : env.baseUrl
      ? 'env'
      : cfgPath.baseUrl
      ? 'env ONYX_CONFIG_PATH'
      : project.baseUrl
      ? 'project file'
      : home.baseUrl
      ? 'home profile'
      : 'default',
    databaseId: input?.databaseId
      ? 'explicit config'
      : env.databaseId
      ? 'env'
      : cfgPath.databaseId
      ? 'env ONYX_CONFIG_PATH'
      : project.databaseId
      ? 'project file'
      : home.databaseId
      ? 'home profile'
      : 'unknown',
    apiKey: input?.apiKey
      ? 'explicit config'
      : env.apiKey
      ? 'env'
      : cfgPath.apiKey
      ? 'env ONYX_CONFIG_PATH'
      : project.apiKey
      ? 'project file'
      : home.apiKey
      ? 'home profile'
      : 'unknown',
    apiSecret: input?.apiSecret
      ? 'explicit config'
      : env.apiSecret
      ? 'env'
      : cfgPath.apiSecret
      ? 'env ONYX_CONFIG_PATH'
      : project.apiSecret
      ? 'project file'
      : home.apiSecret
      ? 'home profile'
      : 'unknown',
    configPath: cfgPathRes.path,
    projectFile: projectRes.path,
    homeProfile: homeRes.path,
  };

  return { ...base, sources };
}

// Redacts secrets for debug logging
function mask<T extends object>(obj: T | undefined): T | undefined {
  if (!obj) return obj;
  const clone = { ...(obj as Record<string, unknown>) } as Record<string, unknown>;
  if (typeof clone.apiKey === 'string') clone.apiKey = '***';
  if (typeof clone.apiSecret === 'string') clone.apiSecret = '***';
  return clone as unknown as T;
}
