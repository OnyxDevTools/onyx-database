import type {
  ApproximateIndexCandidateQuery,
  HnswSearchQuery,
  HnswSearchQueryInput,
  Int64WireInput,
  SemanticVectorSignature,
  SemanticVectorSignatureInput,
  VectorSearchQuery,
  VectorSearchQueryInput,
} from '../types/common';

export const HNSW_QUERY_FORMAT_VERSION = 1 as const;
export const DEFAULT_HNSW_CANDIDATES = 1_000;
export const DEFAULT_HNSW_EF_SEARCH = 1_000;
export const MAX_HNSW_CANDIDATES = 5_000;
export const MAX_HNSW_EF_SEARCH = 20_000;
export const MAX_HNSW_VECTOR_DIMENSION = 16_384;

export const DEFAULT_APPROXIMATE_INDEX_CANDIDATES = 1_000;
export const MAX_APPROXIMATE_INDEX_CANDIDATES = 5_000;
export const MAX_APPROXIMATE_INDEX_ROUTE_VALUES = 5_000;
export const MAX_VECTOR_SEARCH_CANDIDATES = 5_000;

const SIGNED_INT64_MIN = -(1n << 63n);
const SIGNED_INT64_MAX = (1n << 63n) - 1n;
const UINT64_MAX = (1n << 64n) - 1n;
const INT32_MAX = 2_147_483_647;
const SEMANTIC_BAND_COUNT = 4;

function requireInteger(value: number, field: string): void {
  if (!Number.isInteger(value)) throw new TypeError(`${field} must be an integer`);
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new TypeError(`${field} must be finite`);
}

function finiteFloat32(value: number, field: string): number {
  requireFinite(value, field);
  const rounded = Math.fround(value);
  if (!Number.isFinite(rounded)) {
    throw new RangeError(`${field} must be finite in the server Float32 domain`);
  }
  return rounded;
}

function signedInt64(value: Int64WireInput, field: string): string {
  let parsed: bigint;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError(`${field} numbers must be safe integers; use a string or bigint`);
    }
    parsed = BigInt(value);
  } else if (typeof value === 'bigint') {
    parsed = value;
  } else if (typeof value === 'string') {
    const text = value.trim();
    if (!/^-?\d+$/.test(text)) {
      throw new TypeError(`${field} must be a signed decimal 64-bit value`);
    }
    parsed = BigInt(text);
  } else {
    throw new TypeError(`${field} must be a signed decimal 64-bit value`);
  }
  if (parsed < SIGNED_INT64_MIN || parsed > SIGNED_INT64_MAX) {
    throw new RangeError(`${field} exceeds the signed 64-bit range`);
  }
  return parsed.toString();
}

function semanticWord(value: Int64WireInput, field: string): bigint {
  let parsed: bigint;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError(`${field} numbers must be safe integers; use a string or bigint`);
    }
    parsed = BigInt(value);
  } else if (typeof value === 'bigint') {
    parsed = value;
  } else if (typeof value === 'string') {
    const text = value.trim();
    const unsignedHex = text.startsWith('0x') || text.startsWith('0X')
      ? text.slice(2)
      : /[a-f]/i.test(text)
        ? text
        : null;
    if (unsignedHex !== null) {
      if (!/^[0-9a-f]+$/i.test(unsignedHex)) {
        throw new TypeError(`${field} must be signed decimal or unsigned hexadecimal`);
      }
      parsed = BigInt(`0x${unsignedHex}`);
      if (parsed > UINT64_MAX) throw new RangeError(`${field} exceeds 64 bits`);
      return parsed;
    }
    if (!/^-?\d+$/.test(text)) {
      throw new TypeError(`${field} must be signed decimal or unsigned hexadecimal`);
    }
    parsed = BigInt(text);
  } else {
    throw new TypeError(`${field} must be signed decimal or unsigned hexadecimal`);
  }
  if (parsed < SIGNED_INT64_MIN || parsed > SIGNED_INT64_MAX) {
    throw new RangeError(`${field} exceeds the signed 64-bit range`);
  }
  return BigInt.asUintN(64, parsed);
}

function wireWord(value: bigint): string {
  return `0x${BigInt.asUintN(64, value).toString(16).padStart(16, '0')}`;
}

function expectedSemanticBands(words: readonly bigint[]): bigint[] {
  const bitCount = words.length * 64;
  const bandBits = bitCount / SEMANTIC_BAND_COUNT;
  const mask = (1n << BigInt(bandBits)) - 1n;
  const packed = words.reduce(
    (value, word, index) => value | (word << BigInt(index * 64)),
    0n,
  );
  return Array.from({ length: SEMANTIC_BAND_COUNT }, (_, index) =>
    (packed >> BigInt(index * bandBits)) & mask,
  );
}

/** Validate and canonicalize one lossless semantic routing signature. */
export function semanticVectorSignature(
  input: SemanticVectorSignatureInput | SemanticVectorSignature,
): SemanticVectorSignature {
  const calibrationId = signedInt64(input.calibrationId, 'calibrationId');
  if (calibrationId === '0') throw new RangeError('calibrationId must be non-zero');
  requireInteger(input.bucketId, 'bucketId');
  if (input.bucketId < 0 || input.bucketId > INT32_MAX) {
    throw new RangeError(`bucketId must be between 0 and ${INT32_MAX}`);
  }

  const cells = [...input.cells];
  const cellCounts = [...input.cellCounts];
  if (cells.length === 0) throw new RangeError('at least one product cell is required');
  if (cells.length !== cellCounts.length) {
    throw new RangeError('cellCounts must contain one cardinality per product cell');
  }
  let packedBucket = 0;
  let bucketSpace = 1;
  cells.forEach((cell, index) => {
    const count = cellCounts[index];
    requireInteger(cell, `cells[${index}]`);
    requireInteger(count, `cellCounts[${index}]`);
    if (count < 2) throw new RangeError(`cellCounts[${index}] must be at least 2`);
    if (cell < 0 || cell >= count) throw new RangeError(`cells[${index}] is outside its cell count`);
    bucketSpace *= count;
    if (!Number.isSafeInteger(bucketSpace) || bucketSpace > 2_147_483_647) {
      throw new RangeError('product-cell space exceeds the supported Int bucket domain');
    }
    packedBucket = packedBucket * count + cell;
  });
  if (input.bucketId !== packedBucket) {
    throw new RangeError('bucketId does not match the mixed-radix product cells');
  }

  if (input.fingerprint.length < 1 || input.fingerprint.length > 4) {
    throw new RangeError('fingerprint must contain between 1 and 4 64-bit words');
  }
  const fingerprintWords = input.fingerprint.map((word, index) =>
    semanticWord(word, `fingerprint[${index}]`),
  );
  const expectedBands = expectedSemanticBands(fingerprintWords);
  const suppliedBands = input.bands?.map((band, index) => semanticWord(band, `bands[${index}]`));
  if (suppliedBands && suppliedBands.length !== SEMANTIC_BAND_COUNT) {
    throw new RangeError('bands must contain exactly four values');
  }
  if (suppliedBands?.some((band, index) => band !== expectedBands[index])) {
    throw new RangeError('bands do not represent four equal portions of the fingerprint');
  }

  const boundaryConfidence = input.boundaryConfidence ?? 0;
  const floatBoundaryConfidence = finiteFloat32(boundaryConfidence, 'boundaryConfidence');
  if (floatBoundaryConfidence < 0 || floatBoundaryConfidence > 1) {
    throw new RangeError('boundaryConfidence must be between 0 and 1');
  }
  return {
    calibrationId,
    bucketId: input.bucketId,
    cells,
    cellCounts,
    fingerprint: fingerprintWords.map(wireWord),
    bands: expectedBands.map(wireWord),
    boundaryConfidence,
  };
}

/** Validate and canonicalize a native lexical, semantic, or hybrid search value. */
export function vectorSearchQuery(input: VectorSearchQueryInput): VectorSearchQuery {
  const text = input.text ?? null;
  if (text !== null && (typeof text !== 'string' || text.trim().length === 0)) {
    throw new TypeError('text must be non-blank when supplied');
  }
  const semantic = input.semantic ? semanticVectorSignature(input.semantic) : null;
  if (text === null && semantic === null) {
    throw new RangeError('VectorSearchQuery must contain text and/or a semantic signature');
  }
  const minScore = input.minScore ?? null;
  if (minScore !== null) finiteFloat32(minScore, 'minScore');
  const nearbyBucketRadius = input.nearbyBucketRadius ?? 1;
  requireInteger(nearbyBucketRadius, 'nearbyBucketRadius');
  if (nearbyBucketRadius < 0 || nearbyBucketRadius > INT32_MAX) {
    throw new RangeError(`nearbyBucketRadius must be between 0 and ${INT32_MAX}`);
  }
  const maxCandidates = input.maxCandidates ?? 1_000;
  requireInteger(maxCandidates, 'maxCandidates');
  if (maxCandidates < 1 || maxCandidates > MAX_VECTOR_SEARCH_CANDIDATES) {
    throw new RangeError(`maxCandidates must be between 1 and ${MAX_VECTOR_SEARCH_CANDIDATES}`);
  }
  const requireAllTerms = input.requireAllTerms ?? true;
  if (typeof requireAllTerms !== 'boolean') throw new TypeError('requireAllTerms must be boolean');
  return { text, semantic, minScore, nearbyBucketRadius, maxCandidates, requireAllTerms };
}

/** Validate and canonicalize a bounded native-HNSW candidate request. */
export function hnswSearchQuery(input: HnswSearchQueryInput): HnswSearchQuery {
  const formatVersion = input.formatVersion ?? HNSW_QUERY_FORMAT_VERSION;
  if (formatVersion !== HNSW_QUERY_FORMAT_VERSION) {
    throw new RangeError(
      `Unsupported HNSW query formatVersion ${formatVersion}; expected ${HNSW_QUERY_FORMAT_VERSION}`,
    );
  }
  const calibrationId = signedInt64(input.calibrationId, 'HNSW calibrationId');
  if (calibrationId === '0') throw new RangeError('HNSW calibrationId must be non-zero');
  const vector = [...input.vector];
  if (vector.length < 1 || vector.length > MAX_HNSW_VECTOR_DIMENSION) {
    throw new RangeError(`HNSW vector dimensions must be between 1 and ${MAX_HNSW_VECTOR_DIMENSION}`);
  }
  let squaredMagnitude = 0;
  vector.forEach((value, index) => {
    const floatValue = finiteFloat32(value, `HNSW vector[${index}]`);
    squaredMagnitude += floatValue * floatValue;
  });
  if (!Number.isFinite(squaredMagnitude) || squaredMagnitude <= 0) {
    throw new RangeError('HNSW vector must have a non-zero finite norm');
  }
  const maxCandidates = input.maxCandidates ?? DEFAULT_HNSW_CANDIDATES;
  requireInteger(maxCandidates, 'HNSW maxCandidates');
  if (maxCandidates < 1 || maxCandidates > MAX_HNSW_CANDIDATES) {
    throw new RangeError(`HNSW maxCandidates must be between 1 and ${MAX_HNSW_CANDIDATES}`);
  }
  const efSearch = input.efSearch ?? Math.max(DEFAULT_HNSW_EF_SEARCH, maxCandidates);
  requireInteger(efSearch, 'HNSW efSearch');
  if (efSearch < maxCandidates || efSearch > MAX_HNSW_EF_SEARCH) {
    throw new RangeError(
      `HNSW efSearch must be between maxCandidates and ${MAX_HNSW_EF_SEARCH}`,
    );
  }
  const minScore = input.minScore ?? null;
  if (minScore !== null) {
    const floatMinScore = finiteFloat32(minScore, 'HNSW minScore');
    if (floatMinScore < -1 || floatMinScore > 1) {
      throw new RangeError('HNSW minScore must be between -1 and 1');
    }
  }
  return {
    calibrationId,
    vector,
    maxCandidates,
    efSearch,
    minScore,
    formatVersion: HNSW_QUERY_FORMAT_VERSION,
  };
}

/** Validate and canonicalize one bounded ordinary-index candidate route. */
export function approximateIndexCandidateQuery(
  valueOrValues: unknown | readonly unknown[],
  maxCandidates = DEFAULT_APPROXIMATE_INDEX_CANDIDATES,
): ApproximateIndexCandidateQuery {
  requireInteger(maxCandidates, 'maxCandidates');
  if (maxCandidates < 1 || maxCandidates > MAX_APPROXIMATE_INDEX_CANDIDATES) {
    throw new RangeError(
      `maxCandidates must be between 1 and ${MAX_APPROXIMATE_INDEX_CANDIDATES}`,
    );
  }
  const values = Array.isArray(valueOrValues) ? [...valueOrValues] : [valueOrValues];
  if (values.length === 0) {
    throw new RangeError('Approximate index candidates require at least one route value');
  }
  if (values.length > MAX_APPROXIMATE_INDEX_ROUTE_VALUES) {
    throw new RangeError(
      `Approximate index candidate routes cannot exceed ${MAX_APPROXIMATE_INDEX_ROUTE_VALUES} values`,
    );
  }
  if (values.some(value => value === null || value === undefined)) {
    throw new TypeError('Approximate index candidate route values cannot be null');
  }
  return { values, maxCandidates };
}
