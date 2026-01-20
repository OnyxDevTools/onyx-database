import { onyx } from '@onyx.dev/onyx-database';

async function main(): Promise<void> {
  const db = onyx.init();

  const list = await db.ai.getModels();
  if (!list.data || !Array.isArray(list.data) || list.data.length === 0) {
    throw new Error('Model list is empty');
  }

  const first = list.data[0];
  if (!first.id || !first.object) {
    throw new Error('First model is missing id or object');
  }

  const model = await db.ai.getModel(first.id);
  if (model.id !== first.id) {
    throw new Error('Retrieved model id does not match requested id');
  }
  if (!model.owned_by || typeof model.created !== 'number') {
    throw new Error('Model metadata missing owned_by or created timestamp');
  }

  console.log(
    JSON.stringify(
      {
        count: list.data.length,
        firstId: first.id,
        ownedBy: model.owned_by,
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
