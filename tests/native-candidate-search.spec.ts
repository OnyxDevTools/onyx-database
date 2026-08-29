import { describe, expect, it, vi } from 'vitest';

import { QueryBuilder } from '../src/builders/query-builder';
import type { QueryCriteriaOperator } from '../src';
import {
  MAX_APPROXIMATE_INDEX_CANDIDATES,
  MAX_APPROXIMATE_INDEX_ROUTE_VALUES,
  MAX_HNSW_EF_SEARCH,
  MAX_HNSW_VECTOR_DIMENSION,
  MAX_VECTOR_SEARCH_CANDIDATES,
  approximateCandidates,
  approximateIndexCandidateQuery,
  approximateSearch,
  eq,
  hnswCandidates,
  hnswSearchQuery,
  onyx,
  search,
  semanticVectorSignature,
  vectorSearchQuery,
} from '../src';

function executor() {
  return {
    count: vi.fn(),
    queryPage: vi.fn().mockResolvedValue({ records: [], nextPage: null }),
    update: vi.fn(),
    deleteByQuery: vi.fn(),
    stream: vi.fn(),
  };
}

function semanticInput(overrides: Record<string, unknown> = {}) {
  return {
    calibrationId: 73,
    bucketId: 6,
    cells: [1, 2],
    cellCounts: [4, 4],
    fingerprint: [0],
    ...overrides,
  } as any;
}

const operatorMatrix = [
  'EQUAL',
  'NOT_EQUAL',
  'NOT_STARTS_WITH',
  'NOT_NULL',
  'IS_NULL',
  'STARTS_WITH',
  'CONTAINS',
  'CONTAINS_IGNORE_CASE',
  'NOT_CONTAINS_IGNORE_CASE',
  'NOT_CONTAINS',
  'LIKE',
  'NOT_LIKE',
  'MATCHES',
  'NOT_MATCHES',
  'LESS_THAN',
  'GREATER_THAN',
  'BETWEEN',
  'NOT_BETWEEN',
  'LESS_THAN_EQUAL',
  'GREATER_THAN_EQUAL',
  'IN',
  'NOT_IN',
  'CANDIDATES',
  'SEARCH_CANDIDATES',
  'HNSW_CANDIDATES',
] as const satisfies readonly QueryCriteriaOperator[];

type MissingOperator = Exclude<QueryCriteriaOperator, (typeof operatorMatrix)[number]>;
const operatorMatrixIsExhaustive: [MissingOperator] extends [never] ? true : never = true;

describe('native bounded candidate search', () => {
  it('keeps the public operator matrix exhaustive', () => {
    expect(operatorMatrixIsExhaustive).toBe(true);
    expect(operatorMatrix).toContain('NOT_BETWEEN');
  });

  it('canonicalizes lossless semantic and HNSW wire values', () => {
    const semantic = semanticVectorSignature({
      calibrationId: 9_223_372_036_854_775_807n,
      bucketId: 6,
      cells: [1, 2],
      cellCounts: [4, 4],
      fingerprint: ['0xfedcba9876543210'],
      boundaryConfidence: 0.75,
    });
    expect(semantic).toEqual({
      calibrationId: '9223372036854775807',
      bucketId: 6,
      cells: [1, 2],
      cellCounts: [4, 4],
      fingerprint: ['0xfedcba9876543210'],
      bands: [
        '0x0000000000003210',
        '0x0000000000007654',
        '0x000000000000ba98',
        '0x000000000000fedc',
      ],
      boundaryConfidence: 0.75,
    });

    expect(vectorSearchQuery({ text: 'hybrid prompt', semantic, maxCandidates: 321 })).toEqual({
      text: 'hybrid prompt',
      semantic,
      minScore: null,
      nearbyBucketRadius: 1,
      maxCandidates: 321,
      requireAllTerms: true,
    });
    expect(hnswSearchQuery({
      calibrationId: '-9223372036854775735',
      vector: [0.25, -0.5, 0.75],
      maxCandidates: 40,
      efSearch: 96,
      minScore: 0.2,
    })).toEqual({
      calibrationId: '-9223372036854775735',
      vector: [0.25, -0.5, 0.75],
      maxCandidates: 40,
      efSearch: 96,
      minScore: 0.2,
      formatVersion: 1,
    });
  });

  it('serializes typed vector search and all three bounded admission operators', async () => {
    const exec = executor();

    await new QueryBuilder(exec as any, 'ActiveDocumentChunk')
      .search({
        text: 'hybrid ranking',
        semantic: {
          calibrationId: 73n,
          bucketId: 6,
          cells: [1, 2],
          cellCounts: [4, 4],
          fingerprint: ['0xfedcba9876543210'],
          boundaryConfidence: 0.75,
        },
        minScore: 0.42,
        nearbyBucketRadius: 2,
        maxCandidates: 321,
        requireAllTerms: false,
      })
      .list();
    await new QueryBuilder(exec as any, 'ActiveDocumentChunk')
      .inPartition('revision-7')
      .approximateSearch('bounded lexical recall', { maxCandidates: 32 })
      .list();
    await new QueryBuilder(exec as any, 'ChunkAttentionHash')
      .inPartition('revision-7')
      .hnswCandidates({
        calibrationId: 73n,
        vector: [0.25, -0.5, 0.75],
        maxCandidates: 40,
        efSearch: 96,
      })
      .list();
    await new QueryBuilder(exec as any, 'ChunkAttentionHash')
      .inPartition('revision-7')
      .approximateCandidates('bucketId', [6, 7], 17)
      .list();

    const vector = exec.queryPage.mock.calls[0][1].conditions.criteria;
    expect(vector).toMatchObject({
      field: '__full_text__',
      operator: 'MATCHES',
      value: {
        text: 'hybrid ranking',
        semantic: {
          calibrationId: '73',
          bucketId: 6,
          cells: [1, 2],
          cellCounts: [4, 4],
        },
        minScore: 0.42,
        nearbyBucketRadius: 2,
        maxCandidates: 321,
        requireAllTerms: false,
      },
    });
    const lexical = exec.queryPage.mock.calls[1][1].conditions.criteria;
    expect(lexical).toEqual({
      field: '__full_text__',
      operator: 'SEARCH_CANDIDATES',
      value: {
        text: 'bounded lexical recall',
        semantic: null,
        minScore: null,
        nearbyBucketRadius: 1,
        maxCandidates: 32,
        requireAllTerms: true,
      },
    });
    const hnsw = exec.queryPage.mock.calls[2][1].conditions.criteria;
    expect(hnsw.operator).toBe('HNSW_CANDIDATES');
    expect(hnsw.value).toMatchObject({
      calibrationId: '73',
      maxCandidates: 40,
      efSearch: 96,
      formatVersion: 1,
    });
    const scalar = exec.queryPage.mock.calls[3][1].conditions.criteria;
    expect(scalar).toEqual({
      field: 'bucketId',
      operator: 'CANDIDATES',
      value: { values: [6, 7], maxCandidates: 17 },
    });
  });

  it('exposes every vector and candidate builder through the initialized public client', async () => {
    const db = onyx.init({
      baseUrl: 'http://example.test',
      databaseId: 'db',
      apiKey: 'key',
      apiSecret: 'secret',
      fetch: vi.fn() as any,
    });
    const queryPage = vi.fn().mockResolvedValue({ records: [], nextPage: null });
    (db as any)._queryPage = queryPage;

    await db.from('ChunkAttentionHash').search({ text: 'exact lexical' }).list();
    await db.from('ChunkAttentionHash')
      .approximateSearch('bounded lexical', { maxCandidates: 7 })
      .list();
    await db.from('ChunkAttentionHash')
      .hnswCandidates({ calibrationId: '73', vector: [1, 0], maxCandidates: 2, efSearch: 8 })
      .inPartition('revision-7')
      .list();
    await db.from('ChunkAttentionHash')
      .approximateCandidates('bucketId', [6, 7], 17)
      .list();

    expect(() => (db.search as any)({ text: 'must remain table-scoped' }))
      .toThrow(/only supports lexical text/);

    expect(queryPage.mock.calls.map(call => call[1].conditions.criteria.operator)).toEqual([
      'MATCHES',
      'SEARCH_CANDIDATES',
      'HNSW_CANDIDATES',
      'CANDIDATES',
    ]);
    expect(() => db.from('ChunkAttentionHash')
      .approximateCandidates('bucketId', 6)
      .and({ field: 'active', operator: 'EQUAL', value: true }))
      .toThrow(/CANDIDATES must be the sole root/);
  });

  it('rejects compound admission and invalid vector or route work before transport', () => {
    const exec = executor();
    expect(() => new QueryBuilder(exec as any, 't')
      .search('existing')
      .hnswCandidates({ calibrationId: '73', vector: [1] }))
      .toThrow(/sole root/);
    expect(() => new QueryBuilder(exec as any, 't')
      .search('existing')
      .approximateSearch('bounded'))
      .toThrow(/sole root/);
    expect(() => new QueryBuilder(exec as any, 't')
      .search('existing')
      .approximateCandidates('bucketId', 1))
      .toThrow(/sole root/);
    expect(() => new QueryBuilder(exec as any, 't')
      .approximateSearch('bounded')
      .search('must not be appended'))
      .toThrow(/SEARCH_CANDIDATES must be the sole root/);
    expect(() => new QueryBuilder(exec as any, 't')
      .hnswCandidates({ calibrationId: 73, vector: [1] })
      .where({ field: 'active', operator: 'EQUAL', value: true }))
      .toThrow(/HNSW_CANDIDATES must be the sole root/);
    expect(() => new QueryBuilder(exec as any, 't')
      .approximateCandidates('bucketId', 1)
      .or({ field: 'active', operator: 'EQUAL', value: true }))
      .toThrow(/CANDIDATES must be the sole root/);
    expect(() => hnswSearchQuery({ calibrationId: 0, vector: [1] })).toThrow(/non-zero/);
    expect(() => hnswSearchQuery({ calibrationId: 1, vector: [0, 0] })).toThrow(/non-zero finite norm/);
    expect(() => hnswSearchQuery({
      calibrationId: 1,
      vector: Array.from({ length: MAX_HNSW_VECTOR_DIMENSION + 1 }, () => 1),
    })).toThrow(/dimensions/);
    expect(() => hnswSearchQuery({
      calibrationId: 1,
      vector: [1],
      maxCandidates: 2,
      efSearch: 1,
    })).toThrow(/efSearch/);
    expect(() => hnswSearchQuery({
      calibrationId: 1,
      vector: [1],
      efSearch: MAX_HNSW_EF_SEARCH + 1,
    })).toThrow(/efSearch/);
    expect(() => approximateIndexCandidateQuery([], 1)).toThrow(/at least one/);
    expect(() => approximateIndexCandidateQuery(
      Array.from({ length: MAX_APPROXIMATE_INDEX_ROUTE_VALUES + 1 }, (_, index) => index),
      1,
    )).toThrow(/routes cannot exceed/);
    expect(() => approximateIndexCandidateQuery([null], 1)).toThrow(/cannot be null/);
    expect(() => approximateIndexCandidateQuery([1], MAX_APPROXIMATE_INDEX_CANDIDATES + 1))
      .toThrow(/maxCandidates/);
    expect(() => vectorSearchQuery({ text: ' ', maxCandidates: 1 })).toThrow(/non-blank/);
    expect(() => vectorSearchQuery({})).toThrow(/text and\/or/);
    expect(() => vectorSearchQuery({ text: 'query', nearbyBucketRadius: -1 })).toThrow(/between/);
    expect(() => vectorSearchQuery({
      text: 'query',
      maxCandidates: MAX_VECTOR_SEARCH_CANDIDATES + 1,
    })).toThrow(/maxCandidates/);
    expect(() => new QueryBuilder(exec as any, 't').approximateSearch({
      semantic: {
        calibrationId: 73,
        bucketId: 0,
        cells: [0],
        cellCounts: [2],
        fingerprint: [0],
      },
    })).toThrow(/text-only/);
    expect(() => semanticVectorSignature({
      calibrationId: 73,
      bucketId: 5,
      cells: [1, 2],
      cellCounts: [4, 4],
      fingerprint: [0],
    })).toThrow(/mixed-radix/);
  });

  it('rejects candidate operators on either side of a compound or nested condition', () => {
    const exec = executor();
    const candidate = () => approximateCandidates('bucketId', [6, 7], 17);

    expect(() => new QueryBuilder(exec as any, 't').where(eq('status', 'ready')).and(candidate()))
      .toThrow(/CANDIDATES must be the sole root/);
    expect(() => new QueryBuilder(exec as any, 't').where(candidate()).or(eq('status', 'ready')))
      .toThrow(/CANDIDATES must be the sole root/);
    expect(() => new QueryBuilder(exec as any, 't').where(eq('status', 'ready').and(candidate())))
      .toThrow(/CANDIDATES must be the sole root/);

    expect(() => new QueryBuilder(exec as any, 't').where(candidate())).not.toThrow();
    expect(() => new QueryBuilder(exec as any, 't').where(eq('status', 'ready')).and(eq('kind', 'x')))
      .not.toThrow();
  });

  it('validates every semantic signature invariant before transport', () => {
    const canonical = semanticVectorSignature(semanticInput({
      fingerprint: ['fedcba9876543210'],
      bands: ['0x3210', '0x7654', '0xba98', '0xfedc'],
    }));
    expect(canonical.fingerprint).toEqual(['0xfedcba9876543210']);
    expect(semanticVectorSignature(semanticInput({ fingerprint: [0n] })).bands)
      .toEqual(Array.from({ length: 4 }, () => '0x0000000000000000'));

    const invalid = [
      () => semanticVectorSignature(semanticInput({ calibrationId: Number.MAX_SAFE_INTEGER + 1 })),
      () => semanticVectorSignature(semanticInput({ calibrationId: 'not-an-id' })),
      () => semanticVectorSignature(semanticInput({ calibrationId: {} })),
      () => semanticVectorSignature(semanticInput({ calibrationId: '9223372036854775808' })),
      () => semanticVectorSignature(semanticInput({ calibrationId: 0 })),
      () => semanticVectorSignature(semanticInput({ bucketId: 1.5 })),
      () => semanticVectorSignature(semanticInput({ bucketId: -1 })),
      () => semanticVectorSignature(semanticInput({ bucketId: 2_147_483_648 })),
      () => semanticVectorSignature(semanticInput({ cells: [], cellCounts: [] })),
      () => semanticVectorSignature(semanticInput({ cellCounts: [4] })),
      () => semanticVectorSignature(semanticInput({ cells: [1.5, 2] })),
      () => semanticVectorSignature(semanticInput({ cellCounts: [4.5, 4] })),
      () => semanticVectorSignature(semanticInput({ cells: [0], cellCounts: [1], bucketId: 0 })),
      () => semanticVectorSignature(semanticInput({ cells: [4, 2] })),
      () => semanticVectorSignature(semanticInput({
        cells: [0, 0],
        cellCounts: [50_000, 50_000],
        bucketId: 0,
      })),
      () => semanticVectorSignature(semanticInput({ fingerprint: [] })),
      () => semanticVectorSignature(semanticInput({ fingerprint: [0, 0, 0, 0, 0] })),
      () => semanticVectorSignature(semanticInput({ fingerprint: [Number.MAX_SAFE_INTEGER + 1] })),
      () => semanticVectorSignature(semanticInput({ fingerprint: [{}] })),
      () => semanticVectorSignature(semanticInput({ fingerprint: ['0x'] })),
      () => semanticVectorSignature(semanticInput({ fingerprint: ['?'] })),
      () => semanticVectorSignature(semanticInput({ fingerprint: ['0x10000000000000000'] })),
      () => semanticVectorSignature(semanticInput({ fingerprint: ['9223372036854775808'] })),
      () => semanticVectorSignature(semanticInput({ bands: [0, 0, 0] })),
      () => semanticVectorSignature(semanticInput({ bands: [1, 0, 0, 0] })),
      () => semanticVectorSignature(semanticInput({ boundaryConfidence: Number.NaN })),
      () => semanticVectorSignature(semanticInput({ boundaryConfidence: 1e40 })),
      () => semanticVectorSignature(semanticInput({ boundaryConfidence: -0.1 })),
      () => semanticVectorSignature(semanticInput({ boundaryConfidence: 1.1 })),
    ];
    invalid.forEach(validate => expect(validate).toThrow());
  });

  it('validates every vector-managed and HNSW request bound before transport', () => {
    const semantic = semanticVectorSignature(semanticInput());
    expect(vectorSearchQuery({
      semantic,
      minScore: 0,
      nearbyBucketRadius: 0,
      maxCandidates: 1,
      requireAllTerms: false,
    })).toMatchObject({ text: null, semantic, requireAllTerms: false });

    const invalidVectorSearch = [
      () => vectorSearchQuery({ text: 'x', minScore: Number.NaN }),
      () => vectorSearchQuery({ text: 'x', minScore: 1e40 }),
      () => vectorSearchQuery({ text: 'x', nearbyBucketRadius: 1.5 }),
      () => vectorSearchQuery({ text: 'x', nearbyBucketRadius: 2_147_483_648 }),
      () => vectorSearchQuery({ text: 'x', maxCandidates: 1.5 }),
      () => vectorSearchQuery({ text: 'x', maxCandidates: 0 }),
      () => vectorSearchQuery({ text: 'x', requireAllTerms: 'yes' as any }),
    ];
    invalidVectorSearch.forEach(validate => expect(validate).toThrow());

    expect(hnswSearchQuery({ calibrationId: 1n, vector: [1] })).toMatchObject({
      calibrationId: '1',
      maxCandidates: 1_000,
      efSearch: 1_000,
      minScore: null,
    });
    const invalidHnsw = [
      () => hnswSearchQuery({ calibrationId: 1, vector: [1], formatVersion: 2 }),
      () => hnswSearchQuery({ calibrationId: Number.MAX_SAFE_INTEGER + 1, vector: [1] }),
      () => hnswSearchQuery({ calibrationId: 'not-an-id', vector: [1] }),
      () => hnswSearchQuery({ calibrationId: '9223372036854775808', vector: [1] }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [] }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [Number.NaN] }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1e40] }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1e-200] }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [Number.MAX_VALUE, Number.MAX_VALUE] }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1], maxCandidates: 1.5 }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1], maxCandidates: 0 }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1], maxCandidates: 5_001 }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1], efSearch: 1.5 }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1], minScore: Number.NaN }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1], minScore: 1e40 }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1], minScore: -1.1 }),
      () => hnswSearchQuery({ calibrationId: 1, vector: [1], minScore: 1.1 }),
    ];
    invalidHnsw.forEach(validate => expect(validate).toThrow());

    expect(hnswSearchQuery({ calibrationId: 1, vector: [1], minScore: 1.00000001 }).minScore)
      .toBe(1.00000001);
  });

  it('validates scalar routes and exposes condition helpers with canonical values', () => {
    expect(approximateIndexCandidateQuery('ready')).toEqual({
      values: ['ready'],
      maxCandidates: 1_000,
    });
    expect(approximateSearch({ text: 'bounded', maxCandidates: 4 }).toCondition().criteria.operator)
      .toBe('SEARCH_CANDIDATES');
    expect(search({ text: 'typed exact' }).toCondition().criteria.operator).toBe('MATCHES');
    expect(approximateSearch('bounded', { maxCandidates: 4 }).toCondition().criteria.operator)
      .toBe('SEARCH_CANDIDATES');
    expect(hnswCandidates({ calibrationId: 1, vector: [1] }).toCondition().criteria.operator)
      .toBe('HNSW_CANDIDATES');
    expect(approximateCandidates('bucketId', 6, 4).toCondition().criteria.value)
      .toEqual({ values: [6], maxCandidates: 4 });

    const invalidRoutes = [
      () => approximateIndexCandidateQuery([1], 1.5),
      () => approximateIndexCandidateQuery([1], 0),
      () => approximateIndexCandidateQuery(undefined),
      () => approximateCandidates(' ', 1),
      () => approximateSearch({ text: 'bounded', semantic: semanticInput() }),
      () => approximateSearch({ semantic: semanticInput() }),
    ];
    invalidRoutes.forEach(validate => expect(validate).toThrow());
  });

  it('covers direct builder candidate guard failures', () => {
    const exec = executor();
    const semantic = semanticVectorSignature(semanticInput());
    expect(() => new QueryBuilder(exec as any, 't').approximateSearch({ semantic }))
      .toThrow(/text-only/);
    expect(() => new QueryBuilder(exec as any, 't').approximateCandidates(' ', 1))
      .toThrow(/blank/);
  });

  it('rejects candidate-root updates and deletes in both builder implementations', async () => {
    const exec = executor();
    await expect(new QueryBuilder(exec as any, 't').approximateSearch('bounded').delete())
      .rejects.toThrow(/SEARCH_CANDIDATES is a read-only/);
    expect(() => new QueryBuilder(exec as any, 't')
      .hnswCandidates({ calibrationId: 73, vector: [1] })
      .setUpdates({ active: false }))
      .toThrow(/HNSW_CANDIDATES is a read-only/);
    await expect(new QueryBuilder(exec as any, 't')
      .setUpdates({ active: false })
      .approximateCandidates('bucketId', 6)
      .update())
      .rejects.toThrow(/CANDIDATES is a read-only/);
    expect(exec.deleteByQuery).not.toHaveBeenCalled();
    expect(exec.update).not.toHaveBeenCalled();

    const db = onyx.init({
      baseUrl: 'http://example.test',
      databaseId: 'db',
      apiKey: 'key',
      apiSecret: 'secret',
      fetch: vi.fn() as any,
    });
    await expect(db.from('ChunkAttentionHash')
      .approximateCandidates('bucketId', 6)
      .delete())
      .rejects.toThrow(/CANDIDATES is a read-only/);
    expect(() => db.from('ChunkAttentionHash')
      .hnswCandidates({ calibrationId: 73, vector: [1] })
      .setUpdates({ active: false }))
      .toThrow(/HNSW_CANDIDATES is a read-only/);
    await expect(db.from('ChunkAttentionHash')
      .setUpdates({ active: false })
      .approximateSearch('bounded')
      .update())
      .rejects.toThrow(/SEARCH_CANDIDATES is a read-only/);
  });
});
