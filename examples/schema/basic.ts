// filename: examples/schema/basic.ts
import process from 'node:process';
import { onyx, type SchemaEntity, type SchemaRevision, type SchemaUpsertRequest } from '@onyx.dev/onyx-database';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function toRequest(schema: SchemaRevision): SchemaUpsertRequest {
  const { databaseId, ...rest } = schema;
  // meta is not part of the upsert payload
  if ('meta' in rest) {
    delete (rest as Record<string, unknown>).meta;
  }
  return { ...rest, databaseId };
}

function hasTable(schema: SchemaRevision | SchemaUpsertRequest, name: string): boolean {
  const entities = Array.isArray(schema.entities) ? schema.entities : [];
  return entities.some((entity) => entity?.name === name);
}

function addTable(schema: SchemaRevision, table: SchemaEntity): SchemaUpsertRequest {
  if (hasTable(schema, table.name)) return toRequest(schema);
  return {
    ...toRequest(schema),
    revisionDescription: 'Add TempTable for schema example',
    entities: [...(schema.entities ?? []), table],
  };
}

function removeTable(schema: SchemaRevision, name: string): SchemaUpsertRequest {
  return {
    ...toRequest(schema),
    revisionDescription: 'Remove TempTable for schema example',
    entities: (schema.entities ?? []).filter((entity) => entity?.name !== name),
  };
}

async function main(): Promise<void> {
  const db = onyx.init();

  const original = await db.getSchema();
  if (!original.entities.length) {
    throw new Error('expected non-empty schema to run the example');
  }

  const tempTable: SchemaEntity = {
    name: 'TempTable',
    identifier: { name: 'id', generator: 'UUID', type: 'String' },
    attributes: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'name', type: 'String', isNullable: false },
    ],
  };

  // Add a table, validate, and publish.
  const withTemp = addTable(original, tempTable);
  const addDiff = await db.diffSchema(withTemp);
  if (!addDiff.newTables.includes(tempTable.name)) {
    throw new Error('expected TempTable to appear in diff before publish');
  }
  const addValidation = await db.validateSchema(withTemp);
  if (!addValidation.valid) {
    throw new Error(`schema validation failed before publish: ${JSON.stringify(addValidation.errors)}`);
  }
  await db.updateSchema(withTemp, { publish: true });
  await sleep(1500); // give the service time to apply the revision
  const afterAdd = await db.getSchema();
  if (!hasTable(afterAdd, tempTable.name)) {
    throw new Error('expected TempTable to exist after publish');
  }
  console.log('TempTable added and published.');

  // Remove the table, validate, and publish to restore original shape.
  const withoutTemp = removeTable(afterAdd, tempTable.name);
  const removeDiff = await db.diffSchema(withoutTemp);
  if (!removeDiff.removedTables.includes(tempTable.name)) {
    throw new Error('expected TempTable removal to appear in diff before publish');
  }
  const removeValidation = await db.validateSchema(withoutTemp);
  if (!removeValidation.valid) {
    throw new Error(`schema validation failed before cleanup: ${JSON.stringify(removeValidation.errors)}`);
  }
  await db.updateSchema(withoutTemp, { publish: true });
  await sleep(1500); // give the service time to apply the revision
  const finalSchema = await db.getSchema();
  if (hasTable(finalSchema, tempTable.name)) {
    throw new Error('expected TempTable to be removed after cleanup publish');
  }

  console.log('Schema add/validate/publish cycle completed and cleaned up.');
}

main()
  .then(() => {
    console.log('example: completed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
