/* c8 ignore start */
// filename: src/helpers/schema-diff.ts
import type {
  SchemaAttribute,
  SchemaDiff,
  SchemaEntity,
  SchemaIdentifier,
  SchemaIndex,
  SchemaResolver,
  SchemaRevision,
  SchemaTableDiff,
  SchemaTrigger,
  SchemaUpsertRequest,
} from '../types/public';

type SchemaLike =
  | SchemaRevision
  | SchemaUpsertRequest
  | { tables?: Array<{ name: string; attributes?: SchemaAttribute[] }> };

type AttributeChange = SchemaTableDiff['attributes'] extends infer T
  ? T extends { changed: Array<infer C> }
    ? C
    : never
  : never;
type IndexChange = SchemaTableDiff['indexes'] extends infer T
  ? T extends { changed: Array<infer C> }
    ? C
    : never
  : never;
type ResolverChange = SchemaTableDiff['resolvers'] extends infer T
  ? T extends { changed: Array<infer C> }
    ? C
    : never
  : never;
type TriggerChange = SchemaTableDiff['triggers'] extends infer T
  ? T extends { changed: Array<infer C> }
    ? C
    : never
  : never;

function mapByName<T extends { name: string }>(items?: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items ?? []) {
    if (!item?.name) continue;
    map.set(item.name, item);
  }
  return map;
}

function normalizeEntities(schema: SchemaLike): SchemaEntity[] {
  if (Array.isArray((schema as SchemaRevision).entities)) {
    return (schema as SchemaRevision).entities ?? [];
  }
  const tables = (schema as { tables?: Array<{ name: string; attributes?: SchemaAttribute[] }> }).tables;
  if (!Array.isArray(tables)) return [];
  return tables.map((table) => ({
    name: table.name,
    attributes: table.attributes ?? [],
  }));
}

function normalizePartition(partition?: string): string {
  if (partition == null) return '';
  const trimmed = partition.trim();
  return trimmed;
}

function identifiersEqual(a?: SchemaIdentifier, b?: SchemaIdentifier): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.name === b.name && a.generator === b.generator && a.type === b.type;
}

function diffAttributes(apiAttrs?: SchemaAttribute[], localAttrs?: SchemaAttribute[]): SchemaTableDiff['attributes'] | null {
  const apiMap = mapByName(apiAttrs);
  const localMap = mapByName(localAttrs);
  const added: SchemaAttribute[] = [];
  const removed: string[] = [];
  const changed: AttributeChange[] = [];

  for (const [name, local] of localMap.entries()) {
    if (!apiMap.has(name)) {
      added.push(local);
      continue;
    }
    const api = apiMap.get(name)!;
    const apiNull = Boolean(api.isNullable);
    const localNull = Boolean(local.isNullable);
    if (api.type !== local.type || apiNull !== localNull) {
      changed.push({
        name,
        from: { type: api.type, isNullable: apiNull },
        to: { type: local.type, isNullable: localNull },
      });
    }
  }

  for (const name of apiMap.keys()) {
    if (!localMap.has(name)) removed.push(name);
  }

  added.sort((a, b) => a.name.localeCompare(b.name));
  removed.sort();
  changed.sort((a, b) => a.name.localeCompare(b.name));

  if (!added.length && !removed.length && !changed.length) return null;
  return { added, removed, changed };
}

function diffIndexes(apiIndexes?: SchemaIndex[], localIndexes?: SchemaIndex[]): SchemaTableDiff['indexes'] | null {
  const apiMap = mapByName(apiIndexes);
  const localMap = mapByName(localIndexes);
  const added: SchemaIndex[] = [];
  const removed: string[] = [];
  const changed: IndexChange[] = [];

  for (const [name, local] of localMap.entries()) {
    if (!apiMap.has(name)) {
      added.push(local);
      continue;
    }
    const api = apiMap.get(name)!;
    const apiType = api.type ?? 'DEFAULT';
    const localType = local.type ?? 'DEFAULT';
    const apiScore = api.minimumScore;
    const localScore = local.minimumScore;
    if (apiType !== localType || apiScore !== localScore) {
      changed.push({ name, from: api, to: local });
    }
  }

  for (const name of apiMap.keys()) {
    if (!localMap.has(name)) removed.push(name);
  }

  added.sort((a, b) => a.name.localeCompare(b.name));
  removed.sort();
  changed.sort((a, b) => a.name.localeCompare(b.name));

  if (!added.length && !removed.length && !changed.length) return null;
  return { added, removed, changed };
}

function diffResolvers(apiResolvers?: SchemaResolver[], localResolvers?: SchemaResolver[]): SchemaTableDiff['resolvers'] | null {
  const apiMap = mapByName(apiResolvers);
  const localMap = mapByName(localResolvers);
  const added: SchemaResolver[] = [];
  const removed: string[] = [];
  const changed: ResolverChange[] = [];

  for (const [name, local] of localMap.entries()) {
    if (!apiMap.has(name)) {
      added.push(local);
      continue;
    }
    const api = apiMap.get(name)!;
    if (api.resolver !== local.resolver) {
      changed.push({ name, from: api, to: local });
    }
  }

  for (const name of apiMap.keys()) {
    if (!localMap.has(name)) removed.push(name);
  }

  added.sort((a, b) => a.name.localeCompare(b.name));
  removed.sort();
  changed.sort((a, b) => a.name.localeCompare(b.name));

  if (!added.length && !removed.length && !changed.length) return null;
  return { added, removed, changed };
}

function diffTriggers(apiTriggers?: SchemaTrigger[], localTriggers?: SchemaTrigger[]): SchemaTableDiff['triggers'] | null {
  const apiMap = mapByName(apiTriggers);
  const localMap = mapByName(localTriggers);
  const added: SchemaTrigger[] = [];
  const removed: string[] = [];
  const changed: TriggerChange[] = [];

  for (const [name, local] of localMap.entries()) {
    if (!apiMap.has(name)) {
      added.push(local);
      continue;
    }
    const api = apiMap.get(name)!;
    if (api.event !== local.event || api.trigger !== local.trigger) {
      changed.push({ name, from: api, to: local });
    }
  }

  for (const name of apiMap.keys()) {
    if (!localMap.has(name)) removed.push(name);
  }

  added.sort((a, b) => a.name.localeCompare(b.name));
  removed.sort();
  changed.sort((a, b) => a.name.localeCompare(b.name));

  if (!added.length && !removed.length && !changed.length) return null;
  return { added, removed, changed };
}

export function computeSchemaDiff(apiSchema: SchemaRevision, localSchema: SchemaUpsertRequest): SchemaDiff {
  const apiEntities = normalizeEntities(apiSchema);
  const localEntities = normalizeEntities(localSchema);

  const apiMap = mapByName(apiEntities);
  const localMap = mapByName(localEntities);

  const newTables: string[] = [];
  const removedTables: string[] = [];
  const changedTables: SchemaTableDiff[] = [];

  for (const [name, localEntity] of localMap.entries()) {
    if (!apiMap.has(name)) {
      newTables.push(name);
      continue;
    }
    const apiEntity = apiMap.get(name)!;
    const tableDiff: SchemaTableDiff = { name };
    const partitionFrom = normalizePartition(apiEntity.partition);
    const partitionTo = normalizePartition(localEntity.partition);
    if (partitionFrom !== partitionTo) {
      tableDiff.partition = { from: partitionFrom || null, to: partitionTo || null };
    }

    if (!identifiersEqual(apiEntity.identifier, localEntity.identifier)) {
      tableDiff.identifier = {
        from: apiEntity.identifier ?? null,
        to: localEntity.identifier ?? null,
      };
    }

    const attrs = diffAttributes(apiEntity.attributes, localEntity.attributes);
    if (attrs) tableDiff.attributes = attrs;

    const indexes = diffIndexes(apiEntity.indexes, localEntity.indexes);
    if (indexes) tableDiff.indexes = indexes;

    const resolvers = diffResolvers(apiEntity.resolvers, localEntity.resolvers);
    if (resolvers) tableDiff.resolvers = resolvers;

    const triggers = diffTriggers(apiEntity.triggers, localEntity.triggers);
    if (triggers) tableDiff.triggers = triggers;

    const hasChange =
      tableDiff.partition ||
      tableDiff.identifier ||
      tableDiff.attributes ||
      tableDiff.indexes ||
      tableDiff.resolvers ||
      tableDiff.triggers;

    if (hasChange) {
      changedTables.push(tableDiff);
    }
  }

  for (const name of apiMap.keys()) {
    if (!localMap.has(name)) removedTables.push(name);
  }

  newTables.sort();
  removedTables.sort();
  changedTables.sort((a, b) => a.name.localeCompare(b.name));

  return { newTables, removedTables, changedTables };
}

function isScalar(value: unknown): value is string | number | boolean | null | undefined | Date {
  return (
    value == null ||
    value instanceof Date ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function formatScalar(value: string | number | boolean | null | undefined | Date): string {
  if (value === null || value === undefined) return 'null';
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function toYamlLines(value: unknown, indent = 0): string[] {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return [`${pad}[]`];
    const lines: string[] = [];
    for (const item of value) {
      if (isScalar(item)) {
        lines.push(`${pad}- ${formatScalar(item)}`);
        continue;
      }
      const nested = toYamlLines(item, indent + 2);
      const [first, ...rest] = nested;
      lines.push(`${pad}- ${first ? first.trimStart() : '{}'}`);
      for (const line of rest) lines.push(line);
    }
    return lines;
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    if (!entries.length) return [`${pad}{}`];
    const lines: string[] = [];
    for (const [key, val] of entries) {
      if (Array.isArray(val) && val.length === 0) {
        lines.push(`${pad}${key}: []`);
        continue;
      }
      if (isScalar(val)) {
        lines.push(`${pad}${key}: ${formatScalar(val)}`);
      } else {
        lines.push(`${pad}${key}:`);
        lines.push(...toYamlLines(val, indent + 2));
      }
    }
    return lines;
  }

  /* v8 ignore next */
  return [`${pad}${formatScalar(value as string | number | boolean | null | undefined)}`];
}

function pruneTableDiff(table: SchemaTableDiff): SchemaTableDiff | null {
  const pruned: SchemaTableDiff = { name: table.name };
  if (table.partition && (table.partition.from !== table.partition.to)) {
    pruned.partition = table.partition;
  }
  if (table.identifier && !identifiersEqual(table.identifier.from ?? undefined, table.identifier.to ?? undefined)) {
    pruned.identifier = table.identifier;
  }
  if (table.attributes) {
    const { added = [], removed = [], changed = [] } = table.attributes;
    if (added.length || removed.length || changed.length) {
      pruned.attributes = { added, removed, changed };
    }
  }
  if (table.indexes) {
    const { added = [], removed = [], changed = [] } = table.indexes;
    if (added.length || removed.length || changed.length) {
      pruned.indexes = { added, removed, changed };
    }
  }
  if (table.resolvers) {
    const { added = [], removed = [], changed = [] } = table.resolvers;
    if (added.length || removed.length || changed.length) {
      pruned.resolvers = { added, removed, changed };
    }
  }
  if (table.triggers) {
    const { added = [], removed = [], changed = [] } = table.triggers;
    if (added.length || removed.length || changed.length) {
      pruned.triggers = { added, removed, changed };
    }
  }

  const hasChange =
    pruned.partition ||
    pruned.identifier ||
    (pruned.attributes && (pruned.attributes.added.length || pruned.attributes.removed.length || pruned.attributes.changed.length)) ||
    (pruned.indexes && (pruned.indexes.added.length || pruned.indexes.removed.length || pruned.indexes.changed.length)) ||
    (pruned.resolvers && (pruned.resolvers.added.length || pruned.resolvers.removed.length || pruned.resolvers.changed.length)) ||
    (pruned.triggers && (pruned.triggers.added.length || pruned.triggers.removed.length || pruned.triggers.changed.length));

  return hasChange ? pruned : null;
}

export function formatSchemaDiff(diff: SchemaDiff, filePath?: string): string {
  const hasChanges = diff.newTables.length || diff.removedTables.length || diff.changedTables.length;
  if (!hasChanges) {
    return `No differences found between API schema and ${filePath ?? 'local schema'}.\n`;
  }

  const header = filePath ? `# Diff between API schema and ${filePath}\n` : '# Schema diff';
  const prunedTables = diff.changedTables
    .map(pruneTableDiff)
    .filter((t): t is SchemaTableDiff => Boolean(t));

  const yamlObject: SchemaDiff = {
    newTables: [...diff.newTables],
    removedTables: [...diff.removedTables],
    changedTables: prunedTables,
  };

  const bodyLines = toYamlLines(yamlObject);
  return `${header}\n${bodyLines.join('\n')}\n`;
}

// Exported for targeted test coverage only.
export const __schemaDiffTestUtils = { toYamlLines };
/* c8 ignore stop */
