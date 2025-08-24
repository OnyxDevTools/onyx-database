import { describe, it, expect, afterEach, vi } from 'vitest';
import { onyx } from '../src';
import * as chain from '../src/config/chain';

const origEnv = { ...process.env };

afterEach(() => {
  process.env = { ...origEnv };
  onyx.clearCacheConfig();
  vi.useRealTimers();
});

describe('config cache', () => {
  it('reuses resolved config within ttl', () => {
    const spy = vi.spyOn(chain, 'resolveConfig');
    process.env.ONYX_DATABASE_ID = 'id';
    process.env.ONYX_DATABASE_API_KEY = 'k';
    process.env.ONYX_DATABASE_API_SECRET = 's';
    process.env.ONYX_DATABASE_BASE_URL = 'http://env';

    onyx.init();
    onyx.init();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('expires cache after ttl', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(chain, 'resolveConfig');
    process.env.ONYX_DATABASE_ID = 'id';
    process.env.ONYX_DATABASE_API_KEY = 'k';
    process.env.ONYX_DATABASE_API_SECRET = 's';
    process.env.ONYX_DATABASE_BASE_URL = 'http://env';

    onyx.init({ ttl: 100 });
    onyx.init({ ttl: 100 });
    expect(spy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(101);
    onyx.init({ ttl: 100 });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('clearCacheConfig forces re-resolve', () => {
    const spy = vi.spyOn(chain, 'resolveConfig');
    process.env.ONYX_DATABASE_ID = 'id';
    process.env.ONYX_DATABASE_API_KEY = 'k';
    process.env.ONYX_DATABASE_API_SECRET = 's';
    process.env.ONYX_DATABASE_BASE_URL = 'http://env';

    onyx.init();
    onyx.clearCacheConfig();
    onyx.init();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
