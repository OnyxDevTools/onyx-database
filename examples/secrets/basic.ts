// filename: examples/secrets/basic.ts
import process from 'node:process';
import assert from 'node:assert/strict';
import { onyx } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();
  const secretKey = `example-secret-${Date.now()}`;
  const secretValue = 'demo-secret-value';

  const initialSecrets = await db.listSecrets();
  const initialMatches = initialSecrets.records.filter((secret) => secret.key === secretKey);
  assert.equal(initialMatches.length, 0, 'expected no existing secret with this key');
  console.log('Initial secrets list does not include the example key.');

  const saved = await db.putSecret(secretKey, {
    value: secretValue,
    purpose: 'Example secret used in SDK docs',
  });
  console.log('Saved secret metadata:', saved);

  const afterPut = await db.listSecrets();
  const created = afterPut.records.find((secret) => secret.key === secretKey);
  assert(created, 'secret should be visible after putSecret');
  console.log('Secret now present in list:', created);

  const secret = await db.getSecret(secretKey);
  assert.equal(secret.value, secretValue, 'getSecret should return the saved value');
  console.log('Fetched secret:', secret);

  const deleted = await db.deleteSecret(secretKey);
  assert.equal(deleted.key, secretKey, 'deleteSecret should report the deleted key');
  console.log('Secret deleted:', deleted);

  const finalSecrets = await db.listSecrets();
  const stillExists = finalSecrets.records.some((record) => record.key === secretKey);
  assert.equal(stillExists, false, 'secret should no longer be listed after deletion');
  console.log('Final secrets list confirms removal.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
