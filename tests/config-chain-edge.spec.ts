import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveConfig } from '../src/config/chain-edge';
import { DEFAULT_BASE_URL } from '../src/config/defaults';
import { OnyxConfigError } from '../src/errors/config-error';
import type { OnyxConfig } from '../src/types/public';

const clearEnv = (): void => {
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('ONYX_DATABASE') || k === 'ONYX_CONFIG_PATH') delete process.env[k];
  }
};

beforeEach(() => {
  vi.unstubAllEnvs();
  clearEnv();
});

afterEach(() => {
  vi.unstubAllEnvs();
  clearEnv();
});

describe('edge config chain', () => {
  it('reads env configuration only', async () => {
    vi.stubEnv('ONYX_DATABASE_ID', 'edge-db');
    vi.stubEnv('ONYX_DATABASE_BASE_URL', 'http://edge');
    vi.stubEnv('ONYX_DATABASE_API_KEY', 'edge-key');
    vi.stubEnv('ONYX_DATABASE_API_SECRET', 'edge-secret');

    const cfg = await resolveConfig();
    expect(cfg.databaseId).toBe('edge-db');
    expect(cfg.baseUrl).toBe('http://edge');
    expect(cfg.apiKey).toBe('edge-key');
    expect(cfg.apiSecret).toBe('edge-secret');
  });

  it('rejects file-based config on edge', async () => {
    vi.stubEnv('ONYX_CONFIG_PATH', './creds.json');
    await expect(resolveConfig()).rejects.toBeInstanceOf(OnyxConfigError);
  });

  it('throws when required config is missing', async () => {
    await expect(resolveConfig()).rejects.toBeInstanceOf(OnyxConfigError);
  });

  it('throws when fetch is invoked without a global fetch', async () => {
    const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
    try {
      Object.defineProperty(globalThis, 'fetch', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      const cfg = await resolveConfig({
        baseUrl: 'http://edge',
        databaseId: 'edge-db',
        apiKey: 'edge-key',
        apiSecret: 'edge-secret',
      });
      await expect(cfg.fetch('http://example.com')).rejects.toBeInstanceOf(OnyxConfigError);
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, 'fetch', originalFetch);
      } else {
        delete (globalThis as { fetch?: typeof fetch }).fetch;
      }
    }
  });

  it('logs debug output when ONYX_DEBUG is true', async () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(async () => new Response('ok'));
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      vi.stubEnv('ONYX_DEBUG', 'true');
      globalThis.fetch = fetchSpy;
      vi.stubEnv('ONYX_DATABASE_ID', 'edge-db');
      vi.stubEnv('ONYX_DATABASE_BASE_URL', 'http://edge');
      vi.stubEnv('ONYX_DATABASE_API_KEY', 'edge-key');
      vi.stubEnv('ONYX_DATABASE_API_SECRET', 'edge-secret');
      const cfg = await resolveConfig();
      await cfg.fetch('http://example.com');
      expect(fetchSpy).toHaveBeenCalled();
      expect(stderrSpy).toHaveBeenCalled();
    } finally {
      stderrSpy.mockRestore();
      globalThis.fetch = originalFetch;
    }
  });

  it('handles unserializable debug values', async () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(async () => new Response('ok'));
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      vi.stubEnv('ONYX_DEBUG', 'true');
      globalThis.fetch = fetchSpy;
      const loop: Record<string, unknown> = {};
      loop.self = loop;
      const cfg = {
        baseUrl: 'http://edge',
        databaseId: 'edge-db',
        apiKey: 'edge-key',
        apiSecret: 'edge-secret',
        loop,
      } as OnyxConfig;
      await resolveConfig(cfg);
      expect(stderrSpy).toHaveBeenCalled();
    } finally {
      stderrSpy.mockRestore();
      globalThis.fetch = originalFetch;
    }
  });

  it('ignores blank env values', async () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(async () => new Response('ok'));
    try {
      globalThis.fetch = fetchSpy;
      vi.stubEnv('ONYX_DATABASE_ID', '\n');
      const cfg = await resolveConfig({
        baseUrl: 'http://edge',
        databaseId: 'explicit-db',
        apiKey: 'edge-key',
        apiSecret: 'edge-secret',
      });
      expect(cfg.databaseId).toBe('explicit-db');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles missing process env', async () => {
    const originalProcess = globalThis.process;
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(async () => new Response('ok'));
    try {
      // @ts-expect-error: simulate edge without process env
      delete (globalThis as { process?: unknown }).process;
      globalThis.fetch = fetchSpy;
      vi.resetModules();
      const { resolveConfig: resolveConfigNoEnv } = await import('../src/config/chain-edge');
      const cfg = await resolveConfigNoEnv({
        baseUrl: 'http://edge',
        databaseId: 'edge-db',
        apiKey: 'edge-key',
        apiSecret: 'edge-secret',
      });
      expect(cfg.databaseId).toBe('edge-db');
    } finally {
      // @ts-expect-error: restore process
      globalThis.process = originalProcess;
      globalThis.fetch = originalFetch;
    }
  });

  it('falls back to the default baseUrl', async () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(async () => new Response('ok'));
    try {
      globalThis.fetch = fetchSpy;
      vi.stubEnv('ONYX_DATABASE_ID', 'edge-db');
      vi.stubEnv('ONYX_DATABASE_API_KEY', 'edge-key');
      vi.stubEnv('ONYX_DATABASE_API_SECRET', 'edge-secret');
      const cfg = await resolveConfig();
      expect(cfg.baseUrl).toBe(DEFAULT_BASE_URL);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('uses provided fetch implementation when supplied', async () => {
    const globalFetch = globalThis.fetch;
    const customFetch = vi.fn(async () => new Response('ok'));
    try {
      // ensure global fetch would not be used
      // @ts-expect-error override for test
      globalThis.fetch = undefined;
      const cfg = await resolveConfig({
        baseUrl: 'http://edge',
        databaseId: 'edge-db',
        apiKey: 'edge-key',
        apiSecret: 'edge-secret',
        fetch: customFetch,
      });
      await cfg.fetch('http://example.com');
      expect(customFetch).toHaveBeenCalled();
    } finally {
      globalThis.fetch = globalFetch;
    }
  });

  it('ignores env vars when databaseId does not match target', async () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(async () => new Response('ok'));
    try {
      globalThis.fetch = fetchSpy;
      vi.stubEnv('ONYX_DATABASE_ID', 'env-db');
      vi.stubEnv('ONYX_DATABASE_API_KEY', 'env-key');
      vi.stubEnv('ONYX_DATABASE_API_SECRET', 'env-secret');
      const cfg = await resolveConfig({
        baseUrl: 'http://edge',
        databaseId: 'explicit-db',
        apiKey: 'edge-key',
        apiSecret: 'edge-secret',
      });
      expect(cfg.databaseId).toBe('explicit-db');
      expect(cfg.apiKey).toBe('edge-key');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
