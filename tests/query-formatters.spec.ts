import { describe, expect, it, vi } from 'vitest';
import { QueryBuilder } from '../src/builders/query-builder';
import {
  collectAllQueryRecords,
  formatQueryResultsAsCsv,
  formatQueryResultsAsJson,
  formatQueryResultsAsTable,
  formatQueryResultsAsTree,
} from '../src/helpers/query-formatters';
import { onyx } from '../src/impl/onyx';

type TrackRow = {
  code: string;
  name: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  } | null;
  note?: string | null;
};

const PAGE_ONE: TrackRow = {
  code: 'DMR',
  name: 'Del Mar',
  location: {
    city: 'Del Mar',
    state: 'CA',
    country: 'USA',
  },
  note: null,
};

const PAGE_TWO: TrackRow = {
  code: 'SA',
  name: 'Santa Anita',
  location: {
    city: 'Arcadia',
    state: 'CA',
    country: 'USA',
  },
  note: 'Line 1,\n"Line 2"',
};

function makeExec() {
  return {
    count: vi.fn(),
    queryPage: vi.fn().mockImplementation((_table, _select, opts) => {
      if (!opts.nextPage) {
        return Promise.resolve({ records: [PAGE_ONE], nextPage: 'n1' });
      }
      if (opts.nextPage === 'n1') {
        return Promise.resolve({ records: [PAGE_TWO], nextPage: null });
      }
      return Promise.resolve({ records: [], nextPage: null });
    }),
    update: vi.fn(),
    deleteByQuery: vi.fn(),
    stream: vi.fn(),
  };
}

describe('Query formatter terminals', () => {
  it('renders table output with inline nested objects and null values', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder<TrackRow>(exec as any, 'Track')
      .select('code', 'name', 'location', 'note');

    const output = await qb.table({ nullValue: '(null)' });

    expect(exec.queryPage).toHaveBeenCalledTimes(2);
    expect(output).toContain('│ code │');
    expect(output).toContain('DMR');
    expect(output).toContain('SA');
    expect(output).toContain('city=Del Mar, state=CA, country=USA');
    expect(output).toContain('(null)');
  });

  it('renders tree output hierarchically with a configurable root and key field', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder<TrackRow>(exec as any, 'Track')
      .select('code', 'name', 'location', 'note');

    const output = await qb.tree({
      rootLabel: 'tracks',
      keyField: 'code',
      nullValue: '(null)',
    });

    expect(output).toBe([
      'tracks',
      '├─ DMR',
      '│  ├─ name: Del Mar',
      '│  ├─ location',
      '│  │  ├─ city: Del Mar',
      '│  │  ├─ state: CA',
      '│  │  └─ country: USA',
      '│  └─ note: (null)',
      '└─ SA',
      '   ├─ name: Santa Anita',
      '   ├─ location',
      '   │  ├─ city: Arcadia',
      '   │  ├─ state: CA',
      '   │  └─ country: USA',
      '   └─ note: Line 1,',
      '"Line 2"',
    ].join('\n'));
  });

  it('renders csv output with flattened nested objects and RFC-style escaping', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder<TrackRow>(exec as any, 'Track')
      .select('code', 'name', 'location', 'note');

    const output = await qb.csv({ nullValue: 'NULL' });

    expect(output).toBe([
      'code,name,location.city,location.state,location.country,note',
      'DMR,Del Mar,Del Mar,CA,USA,NULL',
      'SA,Santa Anita,Arcadia,CA,USA,"Line 1,',
      '""Line 2"""',
    ].join('\n'));
  });

  it('supports headerless csv output', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder<TrackRow>(exec as any, 'Track')
      .select('code', 'name', 'location', 'note');

    const output = await qb.csv({ headers: false, nullValue: '' });

    expect(output.startsWith('code,name')).toBe(false);
    expect(output).toContain('DMR,Del Mar,Del Mar,CA,USA,');
    expect(output).toContain('SA,Santa Anita,Arcadia,CA,USA,"Line 1,');
  });

  it('renders json output while preserving nested objects', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder<TrackRow>(exec as any, 'Track')
      .select('code', 'name', 'location', 'note');

    const output = await qb.json();

    expect(JSON.parse(output)).toEqual([
      {
        code: 'DMR',
        name: 'Del Mar',
        location: {
          city: 'Del Mar',
          state: 'CA',
          country: 'USA',
        },
        note: null,
      },
      {
        code: 'SA',
        name: 'Santa Anita',
        location: {
          city: 'Arcadia',
          state: 'CA',
          country: 'USA',
        },
        note: 'Line 1,\n"Line 2"',
      },
    ]);
  });

  it('returns valid empty representations for each format', async () => {
    const exec = {
      count: vi.fn(),
      queryPage: vi.fn().mockResolvedValue({ records: [], nextPage: null }),
      update: vi.fn(),
      deleteByQuery: vi.fn(),
      stream: vi.fn(),
    };
    const qb = new QueryBuilder(exec as any, 'Track').select('code', 'name');

    expect(await qb.table()).toBe([
      '┌──────┬──────┐',
      '│ code │ name │',
      '├──────┼──────┤',
      '└──────┴──────┘',
    ].join('\n'));
    expect(await qb.tree()).toBe('results');
    expect(await qb.csv()).toBe('code,name');
    expect(await qb.csv({ headers: false })).toBe('');
    expect(await qb.json()).toBe('[]');
  });

  it('exposes the formatter terminals on the implementation builder', async () => {
    const db = onyx.init({
      baseUrl: 'http://x',
      databaseId: 'd',
      apiKey: 'k',
      apiSecret: 's',
      fetch: vi.fn() as any,
    });
    (db as any)._queryPage = vi.fn().mockResolvedValue({
      records: [{ id: 'u1', email: 'a@example.com' }],
      nextPage: null,
    });

    expect(await db.from('User').select('id', 'email').json({ pretty: false }))
      .toBe('[{"id":"u1","email":"a@example.com"}]');
  });

  it('disallows formatter terminals in update mode', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, 'Track').setUpdates({});

    await expect(qb.table()).rejects.toThrow('Formatting is only applicable in select mode.');
    await expect(qb.tree()).rejects.toThrow('Formatting is only applicable in select mode.');
    await expect(qb.csv()).rejects.toThrow('Formatting is only applicable in select mode.');
    await expect(qb.json()).rejects.toThrow('Formatting is only applicable in select mode.');
  });

  it('supports formatter terminals without an explicit select list', async () => {
    const tableExec = makeExec();
    const tableBuilder = new QueryBuilder<TrackRow>(tableExec as any, 'Track');
    expect(await tableBuilder.table()).toContain('code');

    const csvExec = makeExec();
    const csvBuilder = new QueryBuilder<TrackRow>(csvExec as any, 'Track');
    expect(await csvBuilder.csv()).toContain('code,name,location.city,location.state,location.country,note');
  });

  it('covers formatter helper edge cases', async () => {
    const date = new Date('2026-05-21T20:00:00.000Z');

    expect(formatQueryResultsAsTable([], { headers: false })).toBe('');
    expect(formatQueryResultsAsTable([{ huge: 'abcdef' }], { maxColumnWidth: 0 })).toContain('┌──┐');
    expect(formatQueryResultsAsTable([{ huge: 'abcdef' }], { maxColumnWidth: 5 })).toContain('ab...');

    const flattenedTable = formatQueryResultsAsTable(
      [{
        nested: { deep: { value: 'abcdef' } },
        emptyObject: {},
        emptyArray: [],
        lines: 'a\r\nb',
      }],
      {
        flattenNestedObjects: true,
        headers: false,
        maxColumnWidth: 20,
        nestedSeparator: '/',
      },
      ['nested', 'missing', 'emptyObject', 'emptyArray', 'lines'],
    );
    expect(flattenedTable).toContain('a\\r\\nb');
    expect(formatQueryResultsAsTable([{ huge: 'abcdef' }], { maxColumnWidth: 3 })).toContain('...');

    const inlineTable = formatQueryResultsAsTable(
      [{ values: [], meta: {}, amount: 42n, when: date }],
      { flattenNestedObjects: false, nullValue: 'NULL' },
    );
    expect(inlineTable).toContain('[]');
    expect(inlineTable).toContain('{}');
    expect(inlineTable).toContain('42');
    expect(inlineTable).toContain('2026-05-21T20:00:00.000Z');

    const csv = formatQueryResultsAsCsv(
      [{
        nested: { city: 'Del Mar' },
        emptyObject: {},
        emptyArray: [],
        items: [{ code: 'DMR' }, 'raw'],
        nil: null,
        when: date,
        count: 42n,
        flag: true,
      }],
      {
        delimiter: ';',
        quote: '\'',
        escape: '\\',
        newline: '\r\n',
        nullValue: 'NULL',
      },
      ['nested', 'missing', 'emptyObject', 'emptyArray', 'items', 'nil', 'when', 'count', 'flag'],
    );
    expect(csv).toContain('nested.city;missing;emptyObject;emptyArray;items.0.code;items.1;nil;when;count;flag');
    expect(csv).toContain(';NULL;{};[];DMR;raw;NULL;2026-05-21T20:00:00.000Z;42;true');

    const emptyKeyCsv = formatQueryResultsAsCsv(
      [{
        '': { code: 'DMR' },
        values: ['raw'],
      }],
      { flattenNestedObjects: true },
    );
    expect(emptyKeyCsv).toContain('code,values.0');
    expect(emptyKeyCsv).toContain('DMR,raw');

    const emptyKeyArrayCsv = formatQueryResultsAsCsv(
      [{ '': ['raw'] }],
      { flattenNestedObjects: true },
    );
    expect(emptyKeyArrayCsv).toContain('0');
    expect(emptyKeyArrayCsv).toContain('raw');

    const csvInline = formatQueryResultsAsCsv(
      [{ nested: { city: 'Del Mar' }, list: [{ code: 'DMR' }] }],
      { flattenNestedObjects: false },
    );
    expect(csvInline).toContain('nested,list');
    expect(csvInline).toContain('city=Del Mar,[code=DMR]');

    expect(formatQueryResultsAsJson([123, {
      id: 1,
      when: date,
      missing: undefined,
      values: [1, undefined, 2n],
    }], { pretty: false })).toBe(
      '[{"value":123},{"id":1,"when":"2026-05-21T20:00:00.000Z","missing":null,"values":[1,null,"2"]}]',
    );

    expect(formatQueryResultsAsTree([{}], { includeRoot: false })).toBe('└─ row 1');
    expect(formatQueryResultsAsTree([{
      key: 'value',
      nested: { deep: { id: 'n1' } },
      list: [{ id: 'a1' }, 'raw'],
    }], {
      rootLabel: 'items',
      keyField: 'key',
      maxDepth: 0,
      nullValue: 'NULL',
    })).toBe([
      'items',
      '└─ value',
      '   ├─ nested: deep=id=n1',
      '   └─ list: [id=a1, raw]',
    ].join('\n'));

    expect(formatQueryResultsAsTree([{
      alpha: 'A',
      nested: { beta: { gamma: 'G' } },
      list: [{ label: 'one' }, 'two'],
    }], {
      includeRoot: false,
      maxDepth: 2,
    })).toBe([
      '└─ A',
      '   ├─ nested',
      '   │  └─ beta: gamma=G',
      '   └─ list',
      '      ├─ [0]',
      '      │  └─ label=one',
      '      └─ [1]: two',
    ].join('\n'));

    expect(formatQueryResultsAsTree([{
      alpha: 'A',
      nested: { beta: { gamma: 'G' } },
    }], {
      includeRoot: false,
      maxDepth: 3,
    })).toBe([
      '└─ A',
      '   └─ nested',
      '      └─ beta',
      '         └─ gamma: G',
    ].join('\n'));
    expect(formatQueryResultsAsTree([{ name: 'Named Only' }], { includeRoot: false })).toBe('└─ Named Only');

    expect(await collectAllQueryRecords<number>(async (nextPage?: string) => {
      if (nextPage === 'start') {
        return { records: null, nextPage: 'next' };
      }
      if (nextPage === 'next') {
        return { records: [1, 2], nextPage: null };
      }
      return { records: [], nextPage: null };
    }, 'start')).toEqual([1, 2]);
  });
});
