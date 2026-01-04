import { describe, it, expect } from 'vitest';
import { computeSchemaDiff, formatSchemaDiff } from '../schema/cli/diff';
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
    expect(changed?.details.some((d) => d.includes('attributes'))).toBe(true);
    expect(changed?.details.some((d) => d.includes('type String -> Int'))).toBe(true);
  });

  it('formats empty diff cleanly', () => {
    const apiSchema: SchemaRevision = { databaseId: 'db', entities: [] };
    const localSchema: SchemaUpsertRequest = { entities: [] };
    const diff = computeSchemaDiff(apiSchema, localSchema);
    const output = formatSchemaDiff(diff, './onyx.schema.json');
    expect(output.trim()).toBe('No differences found between API schema and ./onyx.schema.json.');
  });

  it('formats diff sections', () => {
    const apiSchema: SchemaRevision = {
      databaseId: 'db',
      entities: [{ name: 'User', attributes: [{ name: 'id', type: 'String', isNullable: false }] }],
    };
    const localSchema: SchemaUpsertRequest = { entities: [{ name: 'NewTable', attributes: [] }] };
    const output = formatSchemaDiff(computeSchemaDiff(apiSchema, localSchema));
    expect(output).toContain('New Tables:');
    expect(output).toContain('  NewTable');
    expect(output).toContain('Removed Tables:');
    expect(output).toContain('  User');
    expect(output).toContain('Changes:');
  });
});
