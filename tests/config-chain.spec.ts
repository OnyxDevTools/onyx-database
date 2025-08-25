import { describe, it, expect, afterEach } from 'vitest';
import { resolveConfig } from '../src/config/chain';
import { OnyxConfigError } from '../src/errors/config-error';
import { mkdtemp, writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir, homedir } from 'node:os';

const origEnv = { ...process.env };
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

  it('ignores NEXT_* env vars', async () => {
    process.env.NEXT_ONYX_DATABASE_ID = 'nid';
    process.env.NEXT_ONYX_DATABASE_BASE_URL = 'http://next';
    process.env.NEXT_ONYX_DATABASE_API_KEY = 'nk';
    process.env.NEXT_ONYX_DATABASE_API_SECRET = 'ns';
    await expect(resolveConfig({ databaseId: 'nid' })).rejects.toBeInstanceOf(OnyxConfigError);
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
});
