const { execSync } = require('node:child_process');

let cjs;
let esm;

beforeAll(async () => {
  execSync('npm run build', { stdio: 'pipe' });
  cjs = require('../dist/index.cjs');
  esm = await import('../dist/index.js');
});

test('CJS build exports match ESM build', () => {
  const cjsKeys = Object.keys(cjs).sort();
  const esmKeys = Object.keys(esm).sort();
  expect(cjsKeys).toStrictEqual(esmKeys);
});
