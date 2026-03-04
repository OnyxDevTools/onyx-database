// filename: examples/schema/basic.ts
import process from 'node:process';
import { onyx, type SchemaEntity, type SchemaRevision, type SchemaUpsertRequest } from '@onyx.dev/onyx-database';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === 'string') return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '';
}

function isSchemaPublishInProgressError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  if (message.includes('schema publishing operation is already in progress')) return true;
  if (typeof error === 'object' && error !== null && 'body' in error) {
    const body = (error as { body?: unknown }).body;
    if (typeof body === 'object' && body !== null && 'error' in body) {
      const nested = (body as { error?: { message?: unknown } }).error?.message;
      if (typeof nested === 'string') {
        return nested.toLowerCase().includes('schema publishing operation is already in progress');
      }
    }
  }
  return false;
}

async function publishSchemaWithRetry(
  db: ReturnType<typeof onyx.init>,
  schema: SchemaUpsertRequest,
  attempts = 6,
): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await db.updateSchema(schema, { publish: true });
      return;
    } catch (error) {
      const shouldRetry = isSchemaPublishInProgressError(error) && attempt < attempts - 1;
      if (!shouldRetry) throw error;
      const delayMs = 1500 * (attempt + 1);
      console.warn(
        `[schema/basic] publish in progress on server; retrying in ${delayMs}ms (attempt ${attempt + 2}/${attempts})`,
      );
      await sleep(delayMs);
    }
  }
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

  const tempTableName = `TempTable_${Date.now().toString(36)}`;
  const tempTable: SchemaEntity = {
    name: tempTableName,
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
    throw new Error(`expected ${tempTable.name} to appear in diff before publish`);
  }
  const addValidation = await db.validateSchema(withTemp);
  if (!addValidation.valid) {
    throw new Error(`schema validation failed before publish: ${JSON.stringify(addValidation.errors)}`);
  }
  await publishSchemaWithRetry(db, withTemp);
  await sleep(1500); // give the service time to apply the revision
  const afterAdd = await db.getSchema();
  if (!hasTable(afterAdd, tempTable.name)) {
    throw new Error(`expected ${tempTable.name} to exist after publish`);
  }
  console.log(`${tempTable.name} added and published.`);

  // Remove the table, validate, and publish to restore original shape.
  const withoutTemp = removeTable(afterAdd, tempTable.name);
  const removeDiff = await db.diffSchema(withoutTemp);
  if (!removeDiff.removedTables.includes(tempTable.name)) {
    throw new Error(`expected ${tempTable.name} removal to appear in diff before publish`);
  }
  const removeValidation = await db.validateSchema(withoutTemp);
  if (!removeValidation.valid) {
    throw new Error(`schema validation failed before cleanup: ${JSON.stringify(removeValidation.errors)}`);
  }
  await publishSchemaWithRetry(db, withoutTemp);
  await sleep(1500); // give the service time to apply the revision
  const finalSchema = await db.getSchema();
  if (hasTable(finalSchema, tempTable.name)) {
    throw new Error(`expected ${tempTable.name} to be removed after cleanup publish`);
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
