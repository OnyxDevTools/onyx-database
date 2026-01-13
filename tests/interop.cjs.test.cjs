let cjs;
let esm;

beforeAll(async () => {
  cjs = require('../dist/index.cjs');
  esm = await import('../dist/index.js');
}, 30_000);

test('CJS build exports match ESM build', () => {
  const cjsKeys = Object.keys(cjs).sort();
  const esmKeys = Object.keys(esm).sort();
  expect(cjsKeys).toStrictEqual(esmKeys);
});
