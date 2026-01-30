import { describe, it, expect, afterEach } from 'vitest';
import pkg from '../package.json';
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
    expect(sdkName).toBe(pkg.name);
    expect(sdkVersion).toBe(pkg.version);
    const db = onyx.init(cfg);
    expect(db).toBeTruthy();
  });
});
