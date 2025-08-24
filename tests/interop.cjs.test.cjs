const cjs = require('../dist/index.cjs');

test('CJS build exports match ESM build', async () => {
  const esm = await import('../dist/index.js');
  const cjsKeys = Object.keys(cjs).sort();
  const esmKeys = Object.keys(esm).sort();
  expect(cjsKeys).toStrictEqual(esmKeys);
});
