import { onyx } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();

  const script = "db.save({ id: 'u-ai-example', email: 'ai@example.com' })";

  const result = await db.requestScriptApproval({ script });

  if (!result.normalizedScript || !result.normalizedScript.includes('db.save')) {
    throw new Error('Normalized script is missing expected content');
  }
  if (typeof result.requiresApproval !== 'boolean') {
    throw new Error('requiresApproval flag missing');
  }
  if (typeof result.expiresAtIso !== 'string' || result.expiresAtIso.trim() === '') {
    throw new Error('expiresAtIso is missing');
  }
  const expiry = new Date(result.expiresAtIso);
  if (Number.isNaN(expiry.getTime())) {
    throw new Error('expiresAtIso is not a valid date');
  }

  console.log(
    JSON.stringify(
      {
        normalized: result.normalizedScript,
        requiresApproval: result.requiresApproval,
        findings: result.findings ?? '',
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
