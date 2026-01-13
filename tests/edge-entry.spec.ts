import { describe, it, expect, afterEach } from 'vitest';
import { onyx, sdkName, sdkVersion } from '../src/edge';

const cfg = {
  baseUrl: 'http://edge',
  databaseId: 'edge-db',
  apiKey: 'edge-key',
  apiSecret: 'edge-secret',
  fetch: async () => new Response('ok'),
};

afterEach(() => {
  onyx.clearCacheConfig();
});

describe('edge entry', () => {
  it('exports sdk metadata and initializes', () => {
    expect(sdkName).toBe('@onyx.dev/onyx-database');
    expect(sdkVersion).toBe('0.1.0');
    const db = onyx.init(cfg);
    expect(db).toBeTruthy();
  });
});
