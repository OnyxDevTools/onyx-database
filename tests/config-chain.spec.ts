import { describe, it, expect, afterEach } from 'vitest';
import { resolveConfig } from '../src/config/chain';
import { OnyxConfigError } from '../src/errors/config-error';
import { mkdtemp, writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir, homedir } from 'node:os';

const origEnv = { ...process.env };
for (const k of Object.keys(origEnv)) {
  if (k.startsWith('ONYX_DATABASE') || k === 'ONYX_CONFIG_PATH') {
    delete origEnv[k as keyof typeof origEnv];
    delete process.env[k];
  }
}
const origCwd = process.cwd();
const origHome = process.env.HOME;

afterEach(() => {
  process.env = { ...origEnv };
  process.chdir(origCwd);
  if (origHome) process.env.HOME = origHome; else delete process.env.HOME;
});

describe('config chain database selection', () => {
  it('uses env when database id matches', async () => {
    process.env.ONYX_DATABASE_ID = 'envdb';
    process.env.ONYX_DATABASE_BASE_URL = 'http://env';
    process.env.ONYX_DATABASE_API_KEY = 'k';
    process.env.ONYX_DATABASE_API_SECRET = 's';
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
    process.env.HOME = home;
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
    const homeDir = path.join(homedir(), '.onyx');
    await mkdir(homeDir, { recursive: true });
    const file = path.join(homeDir, 'onyx-database.json');
    await writeFile(
      file,
      JSON.stringify({ baseUrl: 'http://home', databaseId: 'hid', apiKey: 'hk', apiSecret: 'hs' }),
    );

    process.env.ONYX_DATABASE_API_KEY = 'ek';
    process.env.ONYX_DATABASE_API_SECRET = 'es';

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
    const homeDir = path.join(homedir(), '.onyx');
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
      const cfg = await resolveConfig();
      expect(cfg.databaseId).toBe('hid');
      expect(cfg.apiKey).toBe('key');
      expect(cfg.apiSecret).toBe('secret');
    } finally {
      await unlink(file);
    }
  });

  it('uses file from ONYX_CONFIG_PATH and ignores env vars', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'cfg-'));
    process.chdir(dir);
    const file = path.join(dir, 'creds.json');
    await writeFile(
      file,
      JSON.stringify({ baseUrl: 'http://path', databaseId: 'pid', apiKey: 'fk', apiSecret: 'fs' }),
    );
    process.env.ONYX_CONFIG_PATH = 'creds.json';
    process.env.ONYX_DATABASE_API_KEY = 'envk';
    const cfg = await resolveConfig();
    expect(cfg.databaseId).toBe('pid');
    expect(cfg.apiKey).toBe('fk');
    expect(cfg.baseUrl).toBe('http://path');
  });

  it('supports absolute ONYX_CONFIG_PATH', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'abs-'));
    const file = path.join(dir, 'creds.json');
    await writeFile(
      file,
      JSON.stringify({ baseUrl: 'http://abs', databaseId: 'aid', apiKey: 'ak', apiSecret: 'as' }),
    );
    process.env.ONYX_CONFIG_PATH = file;
    const cfg = await resolveConfig();
    expect(cfg.databaseId).toBe('aid');
    expect(cfg.apiKey).toBe('ak');
  });

  it('throws when required config is missing', async () => {
    delete process.env.ONYX_DATABASE_ID;
    delete process.env.ONYX_DATABASE_API_KEY;
    delete process.env.ONYX_DATABASE_API_SECRET;
    await expect(resolveConfig()).rejects.toBeInstanceOf(OnyxConfigError);
  });

  it('logs credential source when ONYX_DEBUG=true', async () => {
    process.env.ONYX_DEBUG = 'true';
    process.env.ONYX_DATABASE_ID = 'envdb';
    process.env.ONYX_DATABASE_API_KEY = 'k';
    process.env.ONYX_DATABASE_API_SECRET = 's';
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    await resolveConfig();
    const call = spy.mock.calls.find(([msg]) =>
      msg.includes('credential source: {"databaseId":"env","apiKey":"env","apiSecret":"env"}'),
    );
    expect(call).toBeTruthy();
    spy.mockRestore();
  });
});

