import { describe, it, expect } from 'vitest';
import { computeSchemaDiff, formatSchemaDiff, __schemaDiffTestUtils } from '../src/helpers/schema-diff';
import type { SchemaRevision, SchemaUpsertRequest } from '../src/types/public';

describe('schema diff', () => {
  it('detects new, removed, and changed tables', () => {
    const apiSchema: SchemaRevision = {
      databaseId: 'db',
      entities: [
        {
          name: 'User',
          partition: 'p1',
          identifier: { name: 'id', generator: 'UUID', type: 'String' },
          attributes: [
            { name: 'id', type: 'String', isNullable: false },
            { name: 'email', type: 'String', isNullable: false },
          ],
          indexes: [{ name: 'emailIdx', type: 'DEFAULT' }],
          resolvers: [{ name: 'profile', resolver: 'db.from("Profile").firstOrNull()' }],
          triggers: [{ name: 'onInsert', event: 'PreInsert', trigger: 'noop' }],
        },
        {
          name: 'Changed',
          attributes: [
            { name: 'id', type: 'String', isNullable: false },
            { name: 'status', type: 'String', isNullable: true },
          ],
        },
      ],
    };

    const localSchema: SchemaUpsertRequest = {
      entities: [
        {
          name: 'Changed',
          attributes: [{ name: 'id', type: 'Int', isNullable: false }],
        },
        { name: 'Removed', attributes: [] },
      ],
    };

    const diff = computeSchemaDiff(apiSchema, localSchema);
    expect(diff.newTables).toEqual(['Removed']);
    expect(diff.removedTables).toEqual(['User']);
    const changed = diff.changedTables.find((c) => c.name === 'Changed');
    expect(changed).toBeDefined();
    expect(changed?.attributes?.changed).toEqual([
      { name: 'id', from: { isNullable: false, type: 'String' }, to: { isNullable: false, type: 'Int' } },
    ]);
  });

  it('formats empty diff cleanly', () => {
    const apiSchema: SchemaRevision = { databaseId: 'db', entities: [] };
    const localSchema: SchemaUpsertRequest = { entities: [] };
    const diff = computeSchemaDiff(apiSchema, localSchema);
    const output = formatSchemaDiff(diff, './onyx.schema.json');
    expect(output.trim()).toBe('No differences found between API schema and ./onyx.schema.json.');
  });

  it('formats diff sections as yaml', () => {
    const apiSchema: SchemaRevision = {
      databaseId: 'db',
      entities: [{ name: 'User', attributes: [{ name: 'id', type: 'String', isNullable: false }] }],
    };
    const localSchema: SchemaUpsertRequest = { entities: [{ name: 'NewTable', attributes: [] }] };
    const output = formatSchemaDiff(computeSchemaDiff(apiSchema, localSchema));
    expect(output).toContain('newTables:');
    expect(output).toContain('- \"NewTable\"');
    expect(output).toContain('removedTables:');
    expect(output).toContain('- \"User\"');
    expect(output).toContain('changedTables: []');
  });

  it('captures partition, identifier, attribute, index, resolver, and trigger changes', () => {
    const apiSchema: SchemaRevision = {
      databaseId: 'db',
      entities: [
        {
          name: 'Thing',
          partition: 'p1',
          identifier: { name: 'id', generator: 'UUID', type: 'String' },
          attributes: [
            { name: 'id', type: 'String', isNullable: false },
            { name: 'status', type: 'String', isNullable: true },
            { name: 'oldAttr', type: 'String', isNullable: false },
            { name: 'oldAttr2', type: 'String', isNullable: false },
          ],
          indexes: [
            { name: 'byStatus', type: 'DEFAULT', minimumScore: 1 },
            { name: 'legacyIdx', type: 'DEFAULT', minimumScore: 0.5 },
          ],
          resolvers: [
            { name: 'profile', resolver: 'db.profile()' },
            { name: 'unused', resolver: 'noop' },
            { name: 'details', resolver: 'db.details()' },
          ],
          triggers: [
            { name: 'onInsert', event: 'PreInsert', trigger: 'noop' },
            { name: 'onDelete', event: 'PostDelete', trigger: 'cleanup' },
            { name: 'onArchiveOld', event: 'PostDelete', trigger: 'archive' },
          ],
        },
        {
          name: 'Other',
          partition: 'p-other',
          attributes: [{ name: 'id', type: 'String', isNullable: false }],
        },
      ],
    };

    const localSchema: SchemaUpsertRequest = {
      entities: [
        {
          name: 'Thing',
          partition: 'p2',
          identifier: { name: 'id', generator: 'None', type: 'Int' },
          attributes: [
            { name: 'id', type: 'Int', isNullable: false },
            { name: 'status', type: 'String', isNullable: false },
            { name: 'newAttr', type: 'Boolean', isNullable: false },
            { name: 'newAttrB', type: 'Int', isNullable: true },
          ],
          indexes: [
            { name: 'byStatus', type: 'LUCENE', minimumScore: 2 },
            { name: 'legacyIdx', type: 'LUCENE', minimumScore: 1 },
            { name: 'newIndex', type: 'DEFAULT' },
            { name: 'newIndexB', type: 'DEFAULT' },
          ],
          resolvers: [
            { name: 'profile', resolver: 'db.profile.updated()' },
            { name: 'newResolver', resolver: 'db.extra()' },
            { name: 'newResolverB', resolver: 'db.extraB()' },
            { name: 'details', resolver: 'db.details.updated()' },
          ],
          triggers: [
            { name: 'onInsert', event: 'PreInsert', trigger: 'noop' },
            { name: 'onDelete', event: 'PreDelete', trigger: 'new' },
            { name: 'onUpdate', event: 'PostUpdate', trigger: 'track' },
            { name: 'onArchiveNew', event: 'PostDelete', trigger: 'archiveNew' },
            { name: 'onArchiveOld', event: 'PreDelete', trigger: 'archiveUpdated' },
          ],
        },
        {
          name: 'Other',
          partition: 'p-other-2',
          attributes: [{ name: 'id', type: 'String', isNullable: false }],
        },
      ],
    };

    const diff = computeSchemaDiff(apiSchema, localSchema);
    expect(diff.newTables).toEqual([]);
    expect(diff.removedTables).toEqual([]);
    expect(diff.changedTables.length).toBeGreaterThanOrEqual(2);
    const table = diff.changedTables.find((t) => t.name === 'Thing')!;
    expect(table.partition).toEqual({ from: 'p1', to: 'p2' });
    expect(table.identifier?.from?.generator).toBe('UUID');
    expect(table.identifier?.to?.generator).toBe('None');
    expect(table.attributes?.added.map((a) => a.name).sort()).toEqual(['newAttr', 'newAttrB']);
    expect(table.attributes?.removed.sort()).toEqual(['oldAttr', 'oldAttr2']);
    expect(table.attributes?.changed).toEqual([
      { name: 'id', from: { type: 'String', isNullable: false }, to: { type: 'Int', isNullable: false } },
      { name: 'status', from: { type: 'String', isNullable: true }, to: { type: 'String', isNullable: false } },
    ]);
    expect(table.indexes?.changed).toEqual([
      { name: 'byStatus', from: { name: 'byStatus', type: 'DEFAULT', minimumScore: 1 }, to: { name: 'byStatus', type: 'LUCENE', minimumScore: 2 } },
      { name: 'legacyIdx', from: { name: 'legacyIdx', type: 'DEFAULT', minimumScore: 0.5 }, to: { name: 'legacyIdx', type: 'LUCENE', minimumScore: 1 } },
    ]);
    expect(table.indexes?.added.map((idx) => idx.name).sort()).toEqual(['newIndex', 'newIndexB']);
    expect(table.resolvers?.added.map((r) => r.name).sort()).toEqual(['newResolver', 'newResolverB']);
    expect(table.resolvers?.removed).toEqual(['unused']);
    expect(table.resolvers?.changed?.map((r) => r.name).sort()).toEqual(['details', 'profile']);
    expect(table.triggers?.added.map((t) => t.name).sort()).toEqual(['onArchiveNew', 'onUpdate']);
    expect(table.triggers?.changed?.map((t) => t.name).sort()).toEqual(['onArchiveOld', 'onDelete']);

    const formatted = formatSchemaDiff(diff, './onyx.schema.json');
    expect(formatted).toContain('# Diff between API schema and ./onyx.schema.json');
    expect(formatted).toContain('partition:');
    expect(formatted).toContain('identifier:');
    expect(formatted).toContain('attributes:');
    expect(formatted).toContain('indexes:');
    expect(formatted).toContain('resolvers:');
    expect(formatted).toContain('triggers:');
  });

  it('supports legacy tables shape when computing diff', () => {
    const apiSchema: SchemaRevision = { databaseId: 'db', entities: [] };
    const legacySchema = {
      tables: [{ name: 'Legacy', attributes: [{ name: 'id', type: 'String', isNullable: false }] }],
    } as unknown as SchemaUpsertRequest;

    const diff = computeSchemaDiff(apiSchema, legacySchema);
    expect(diff.newTables).toEqual(['Legacy']);
    expect(diff.removedTables).toEqual([]);
    expect(diff.changedTables).toEqual([]);
  });

  it('formats scalars directly with toYamlLines for full coverage', () => {
    const lines = __schemaDiffTestUtils.toYamlLines('scalar');
    expect(lines).toEqual(['"scalar"']);
  });

  it('drops unchanged tables when pruning diffs', () => {
    const output = formatSchemaDiff(
      {
        newTables: [],
        removedTables: [],
        changedTables: [{ name: 'EmptyTable' } as any],
      },
      './onyx.schema.json',
    );
    expect(output).toContain('changedTables: []');
  });
});
