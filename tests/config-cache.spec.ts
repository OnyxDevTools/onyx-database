import { describe, it, expect, afterEach, vi } from 'vitest';
import { onyx } from '../src';
import * as chain from '../src/config/chain';

const cfg = { baseUrl: 'http://env', databaseId: 'id', apiKey: 'k', apiSecret: 's' };

afterEach(() => {
  onyx.clearCacheConfig();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('config cache', () => {
  it('reuses resolved config within ttl', () => {
    const spy = vi.spyOn(chain, 'resolveConfig');

    onyx.init(cfg);
    onyx.init(cfg);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('expires cache after ttl', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(chain, 'resolveConfig');

    onyx.init({ ...cfg, ttl: 100 });
    onyx.init({ ...cfg, ttl: 100 });
    expect(spy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(101);
    onyx.init({ ...cfg, ttl: 100 });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('clearCacheConfig forces re-resolve', () => {
    const spy = vi.spyOn(chain, 'resolveConfig');

    onyx.init(cfg);
    onyx.clearCacheConfig();
    onyx.init(cfg);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
