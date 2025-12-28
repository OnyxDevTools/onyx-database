import { createRequire } from 'module';
import { execSync } from 'node:child_process';
import { beforeAll, test, expect } from 'vitest';

const require = createRequire(import.meta.url);

let cjs;
let esm;

beforeAll(async () => {
  execSync('npm run build', { stdio: 'pipe' });
  cjs = require('../dist/index.cjs');
  esm = await import('../dist/index.js');
}, 30_000);

test('ESM build exports match CJS build', () => {
  const cjsKeys = Object.keys(cjs).sort();
  const esmKeys = Object.keys(esm).sort();
  expect(esmKeys).toStrictEqual(cjsKeys);
});
