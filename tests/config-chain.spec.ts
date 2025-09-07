import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { resolveConfig } from '../src/config/chain';
import { OnyxConfigError } from '../src/errors/config-error';
import { mkdtemp, writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

const clearEnv = (): void => {
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('ONYX_DATABASE') || k === 'ONYX_CONFIG_PATH') delete process.env[k];
  }
};

clearEnv();
const origCwd = process.cwd();

beforeEach(() => {
  vi.unstubAllEnvs();
  clearEnv();
});

afterEach(() => {
  vi.unstubAllEnvs();
  clearEnv();
  process.chdir(origCwd);
  vi.doUnmock('node:os');
});

describe('config chain database selection', () => {
  it('uses env when database id matches', async () => {
    vi.stubEnv('ONYX_DATABASE_ID', 'envdb');
    vi.stubEnv('ONYX_DATABASE_BASE_URL', 'http://env');
    vi.stubEnv('ONYX_DATABASE_API_KEY', 'k');
    vi.stubEnv('ONYX_DATABASE_API_SECRET', 's');
    const cfg = await resolveConfig({ databaseId: 'envdb' });
    expect(cfg.baseUrl).toBe('http://env');
    expect(cfg.apiKey).toBe('k');
    expect(cfg.apiSecret).toBe('s');
  });

  it('prefers project file over home profile when env id differs', async () => {
    const proj = await mkdtemp(path.join(tmpdir(), 'proj-'));
    process.chdir(proj);
    await writeFile(
      path.join(proj, 'onyx-database-idb.json'),
      JSON.stringify({ baseUrl: 'http://proj', apiKey: 'pk', apiSecret: 'ps', databaseId: 'idb' }),
    );

    const home = await mkdtemp(path.join(tmpdir(), 'home-'));
    vi.stubEnv('HOME', home);
    await mkdir(path.join(home, '.onyx'), { recursive: true });
    await writeFile(
      path.join(home, '.onyx', 'onyx-database-idb.json'),
      JSON.stringify({ baseUrl: 'http://home', apiKey: 'hk', apiSecret: 'hs', databaseId: 'idb' }),
    );

    const cfg = await resolveConfig({ databaseId: 'idb' });
    expect(cfg.baseUrl).toBe('http://proj');
    expect(cfg.apiKey).toBe('pk');
  });

  it('supplements env with home profile when database id missing', async () => {
    const proj = await mkdtemp(path.join(tmpdir(), 'proj-'));
    process.chdir(proj);
    const home = await mkdtemp(path.join(tmpdir(), 'home-'));
    vi.stubEnv('HOME', home);
    vi.doMock('node:os', () => ({ homedir: () => home }));
    const homeDir = path.join(home, '.onyx');
    await mkdir(homeDir, { recursive: true });
    const file = path.join(homeDir, 'onyx-database.json');
    await writeFile(
      file,
      JSON.stringify({ baseUrl: 'http://home', databaseId: 'hid', apiKey: 'hk', apiSecret: 'hs' }),
    );

    vi.stubEnv('ONYX_DATABASE_ID', '');
    vi.stubEnv('ONYX_DATABASE_API_KEY', 'ek');
    vi.stubEnv('ONYX_DATABASE_API_SECRET', 'es');

    try {
      const cfg = await resolveConfig();
      expect(cfg.databaseId).toBe('hid');
      expect(cfg.apiKey).toBe('ek');
      expect(cfg.apiSecret).toBe('es');
      expect(cfg.baseUrl).toBe('http://home');
    } finally {
      await unlink(file);
    }
  });

  it('parses profile values with stray newlines', async () => {
    const proj = await mkdtemp(path.join(tmpdir(), 'proj-'));
    process.chdir(proj);
    const home = await mkdtemp(path.join(tmpdir(), 'home-'));
    vi.stubEnv('HOME', home);
    vi.doMock('node:os', () => ({ homedir: () => home }));
    const homeDir = path.join(home, '.onyx');
    await mkdir(homeDir, { recursive: true });
    const file = path.join(homeDir, 'onyx-database.json');
    const data = `{
  "baseUrl": "http://home",
  "databaseId": "hid",
  "apiKey": "
key",
  "apiSecret": "
secret"
}`;
    await writeFile(file, data);
    try {
      vi.stubEnv('ONYX_DATABASE_ID', '');
      vi.stubEnv('ONYX_DATABASE_API_KEY', '');
      vi.stubEnv('ONYX_DATABASE_API_SECRET', '');
      const cfg = await resolveConfig();
      expect(cfg.databaseId).toBe('hid');
      expect(cfg.apiKey).toBe('key');
      expect(cfg.apiSecret).toBe('secret');
    } finally {
      await unlink(file);
    }
  });

  it('env vars override ONYX_CONFIG_PATH file', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'cfg-'));
    process.chdir(dir);
    const file = path.join(dir, 'creds.json');
    await writeFile(
      file,
      JSON.stringify({ baseUrl: 'http://path', databaseId: 'pid', apiKey: 'fk', apiSecret: 'fs' }),
    );
    vi.stubEnv('ONYX_CONFIG_PATH', 'creds.json');
    vi.stubEnv('ONYX_DATABASE_API_KEY', 'envk');
    const cfg = await resolveConfig();
    expect(cfg.databaseId).toBe('pid');
    expect(cfg.apiKey).toBe('envk');
    expect(cfg.baseUrl).toBe('http://path');
  });

  it('ONYX_CONFIG_PATH overrides project file', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'proj-'));
    process.chdir(dir);
    await writeFile(
      path.join(dir, 'onyx-database.json'),
      JSON.stringify({ baseUrl: 'http://proj', databaseId: 'idp', apiKey: 'pk', apiSecret: 'ps' }),
    );
    const cfgFile = path.join(dir, 'creds.json');
    await writeFile(
      cfgFile,
      JSON.stringify({ baseUrl: 'http://cfg', databaseId: 'idc', apiKey: 'ck', apiSecret: 'cs' }),
    );
    vi.stubEnv('ONYX_CONFIG_PATH', 'creds.json');
    const cfg = await resolveConfig();
    expect(cfg.databaseId).toBe('idc');
    expect(cfg.apiKey).toBe('ck');
    expect(cfg.baseUrl).toBe('http://cfg');
  });

  it('supports absolute ONYX_CONFIG_PATH', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'abs-'));
    const file = path.join(dir, 'creds.json');
    await writeFile(
      file,
      JSON.stringify({ baseUrl: 'http://abs', databaseId: 'aid', apiKey: 'ak', apiSecret: 'as' }),
    );
    vi.stubEnv('ONYX_CONFIG_PATH', file);
    const cfg = await resolveConfig();
    expect(cfg.databaseId).toBe('aid');
    expect(cfg.apiKey).toBe('ak');
  });

  it('throws when required config is missing', async () => {
    const proj = await mkdtemp(path.join(tmpdir(), 'proj-'));
    process.chdir(proj);
    const home = await mkdtemp(path.join(tmpdir(), 'home-'));
    vi.stubEnv('HOME', home);
    vi.doMock('node:os', () => ({ homedir: () => home }));
    vi.stubEnv('ONYX_DATABASE_ID', '');
    vi.stubEnv('ONYX_DATABASE_API_KEY', '');
    vi.stubEnv('ONYX_DATABASE_API_SECRET', '');
    await expect(resolveConfig()).rejects.toBeInstanceOf(OnyxConfigError);
  });

  it('logs credential source when ONYX_DEBUG=true', async () => {
    vi.stubEnv('ONYX_DEBUG', 'true');
    vi.stubEnv('ONYX_DATABASE_ID', 'envdb');
    vi.stubEnv('ONYX_DATABASE_API_KEY', 'k');
    vi.stubEnv('ONYX_DATABASE_API_SECRET', 's');
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    await resolveConfig();
    const call = spy.mock.calls.find(([msg]) =>
      msg.includes('credential source: {"databaseId":"env","apiKey":"env","apiSecret":"env"}'),
    );
    expect(call).toBeTruthy();
    spy.mockRestore();
  });
});

