import type {
  SchemaAttribute,
  SchemaEntity,
  SchemaIdentifier,
  SchemaIndex,
  SchemaResolver,
  SchemaRevision,
  SchemaTrigger,
  SchemaUpsertRequest,
} from '../../src/types/public';

type SchemaLike = SchemaRevision | SchemaUpsertRequest | { tables?: Array<{ name: string; attributes?: SchemaAttribute[] }> };

export type SchemaDiff = {
  /**
   * Tables present in the local file but not in the API schema (would be added).
   */
  newTables: string[];
  /**
   * Tables present in the API schema but not in the local file (would be removed).
   */
  removedTables: string[];
  /**
   * Tables that exist in both schemas but differ in structure.
   */
  changedTables: Array<{ name: string; details: string[] }>;
};

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

function formatIdentifier(id?: SchemaIdentifier): string {
  if (!id) return '';
  const parts = [id.name ? `name=${id.name}` : null, id.generator ? `generator=${id.generator}` : null, id.type ? `type=${id.type}` : null].filter(Boolean);
  return parts.join(', ');
}

function describeIdentifierChange(api?: SchemaIdentifier, local?: SchemaIdentifier): string | null {
  if (!api && !local) return null;
  if (!api && local) return 'identifier removed';
  if (api && !local) return 'identifier added';
  if (!api || !local) return null;
  if (api.name === local.name && api.generator === local.generator && api.type === local.type) {
    return null;
  }
  return `identifier: ${formatIdentifier(api) || 'none'} -> ${formatIdentifier(local) || 'none'}`;
}

function describePartitionChange(api?: string, local?: string): string | null {
  const norm = (v?: string) => (v == null || v === '' ? '' : v);
  if (norm(api) === norm(local)) return null;
  return `partition: ${norm(api) || 'none'} -> ${norm(local) || 'none'}`;
}

function describeAttribute(attr: SchemaAttribute): string {
  const nullable = attr.isNullable ? 'true' : 'false';
  return `${attr.name} (${attr.type ?? 'unknown'}, nullable: ${nullable})`;
}

function describeAttributeChange(api: SchemaAttribute, local: SchemaAttribute): string | null {
  const diffs: string[] = [];
  if (api.type !== local.type) {
    diffs.push(`type ${api.type ?? 'unknown'} -> ${local.type ?? 'unknown'}`);
  }
  const apiNull = Boolean(api.isNullable);
  const localNull = Boolean(local.isNullable);
  if (apiNull !== localNull) {
    diffs.push(`nullable ${apiNull} -> ${localNull}`);
  }
  if (!diffs.length) return null;
  return `${local.name}: ${diffs.join('; ')}`;
}

function describeIndex(idx: SchemaIndex): string {
  const parts = [`type: ${idx.type ?? 'DEFAULT'}`];
  if (idx.minimumScore != null) parts.push(`minScore: ${idx.minimumScore}`);
  return `${idx.name} (${parts.join(', ')})`;
}

function describeIndexChange(api: SchemaIndex, local: SchemaIndex): string | null {
  const diffs: string[] = [];
  if (api.type !== local.type) {
    diffs.push(`type ${api.type ?? 'DEFAULT'} -> ${local.type ?? 'DEFAULT'}`);
  }
  if (api.minimumScore !== local.minimumScore) {
    diffs.push(`minScore ${api.minimumScore ?? 'none'} -> ${local.minimumScore ?? 'none'}`);
  }
  if (!diffs.length) return null;
  return `${local.name}: ${diffs.join('; ')}`;
}

function describeResolverChange(api: SchemaResolver, local: SchemaResolver): string | null {
  if (api.resolver === local.resolver) return null;
  return `${local.name}: resolver changed`;
}

function describeTrigger(trigger: SchemaTrigger): string {
  return `${trigger.name} (${trigger.event})`;
}

function describeTriggerChange(api: SchemaTrigger, local: SchemaTrigger): string | null {
  const diffs: string[] = [];
  if (api.event !== local.event) {
    diffs.push(`event ${api.event ?? 'none'} -> ${local.event ?? 'none'}`);
  }
  if (api.trigger !== local.trigger) {
    diffs.push('trigger changed');
  }
  if (!diffs.length) return null;
  return `${local.name}: ${diffs.join('; ')}`;
}

function diffCollections<T extends { name: string }>(
  apiItems: T[] | undefined,
  localItems: T[] | undefined,
  describeAdd: (item: T) => string,
  describeChange?: (api: T, local: T) => string | null,
): { added: string[]; removed: string[]; changed: string[] } {
  const apiMap = mapByName(apiItems);
  const localMap = mapByName(localItems);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [name, local] of localMap.entries()) {
    if (!apiMap.has(name)) {
      added.push(describeAdd(local));
      continue;
    }
    if (describeChange) {
      const detail = describeChange(apiMap.get(name)!, local);
      if (detail) changed.push(detail);
    }
  }

  for (const name of apiMap.keys()) {
    if (!localMap.has(name)) removed.push(name);
  }

  return { added, removed, changed };
}

export function computeSchemaDiff(apiSchema: SchemaRevision, localSchema: SchemaUpsertRequest): SchemaDiff {
  const apiEntities = normalizeEntities(apiSchema);
  const localEntities = normalizeEntities(localSchema);

  const apiMap = mapByName(apiEntities);
  const localMap = mapByName(localEntities);

  const newTables: string[] = [];
  const removedTables: string[] = [];
  const changedTables: Array<{ name: string; details: string[] }> = [];

  for (const [name, localEntity] of localMap.entries()) {
    if (!apiMap.has(name)) {
      newTables.push(name);
      continue;
    }
    const apiEntity = apiMap.get(name)!;
    const details: string[] = [];

    const partitionChange = describePartitionChange(apiEntity.partition, localEntity.partition);
    if (partitionChange) details.push(partitionChange);

    const idChange = describeIdentifierChange(apiEntity.identifier, localEntity.identifier);
    if (idChange) details.push(idChange);

    const attrDiff = diffCollections(apiEntity.attributes, localEntity.attributes, (attr) => `+ ${describeAttribute(attr)}`, describeAttributeChange);
    if (attrDiff.added.length || attrDiff.removed.length || attrDiff.changed.length) {
      details.push('attributes:');
      for (const a of attrDiff.added) details.push(`  ${a}`);
      for (const c of attrDiff.changed) details.push(`  ~ ${c}`);
      for (const r of attrDiff.removed) details.push(`  - ${r}`);
    }

    const idxDiff = diffCollections(apiEntity.indexes, localEntity.indexes, (idx) => `+ ${describeIndex(idx)}`, describeIndexChange);
    if (idxDiff.added.length || idxDiff.removed.length || idxDiff.changed.length) {
      details.push('indexes:');
      for (const a of idxDiff.added) details.push(`  ${a}`);
      for (const c of idxDiff.changed) details.push(`  ~ ${c}`);
      for (const r of idxDiff.removed) details.push(`  - ${r}`);
    }

    const resolverDiff = diffCollections(apiEntity.resolvers, localEntity.resolvers, (resolver) => `+ ${resolver.name}`, describeResolverChange);
    if (resolverDiff.added.length || resolverDiff.removed.length || resolverDiff.changed.length) {
      details.push('resolvers:');
      for (const a of resolverDiff.added) details.push(`  ${a}`);
      for (const c of resolverDiff.changed) details.push(`  ~ ${c}`);
      for (const r of resolverDiff.removed) details.push(`  - ${r}`);
    }

    const triggerDiff = diffCollections(apiEntity.triggers, localEntity.triggers, (trigger) => `+ ${describeTrigger(trigger)}`, describeTriggerChange);
    if (triggerDiff.added.length || triggerDiff.removed.length || triggerDiff.changed.length) {
      details.push('triggers:');
      for (const a of triggerDiff.added) details.push(`  ${a}`);
      for (const c of triggerDiff.changed) details.push(`  ~ ${c}`);
      for (const r of triggerDiff.removed) details.push(`  - ${r}`);
    }

    if (details.length) {
      changedTables.push({ name, details });
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

export function formatSchemaDiff(diff: SchemaDiff, filePath?: string): string {
  const lines: string[] = [];
  const hasChanges = diff.newTables.length || diff.removedTables.length || diff.changedTables.length;
  if (!hasChanges) {
    return `No differences found between API schema and ${filePath ?? 'local file'}.\n`;
  }

  if (filePath) lines.push(`Comparing API schema to ${filePath}`);

  lines.push('New Tables:');
  if (diff.newTables.length) {
    for (const t of diff.newTables) lines.push(`  ${t}`);
  } else {
    lines.push('  (none)');
  }

  lines.push('Removed Tables:');
  if (diff.removedTables.length) {
    for (const t of diff.removedTables) lines.push(`  ${t}`);
  } else {
    lines.push('  (none)');
  }

  lines.push('Changes:');
  if (diff.changedTables.length) {
    for (const table of diff.changedTables) {
      lines.push(`  ${table.name}`);
      for (const detail of table.details) {
        lines.push(`      ${detail}`);
      }
    }
  } else {
    lines.push('  (none)');
  }

  return `${lines.join('\n')}\n`;
}
