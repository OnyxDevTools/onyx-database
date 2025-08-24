import { createRequire } from 'module';
import { test, expect } from 'vitest';

const require = createRequire(import.meta.url);
const cjs = require('../dist/index.cjs');
const esm = await import('../dist/index.js');

test('ESM build exports match CJS build', () => {
  const cjsKeys = Object.keys(cjs).sort();
  const esmKeys = Object.keys(esm).sort();
  expect(esmKeys).toStrictEqual(cjsKeys);
});
