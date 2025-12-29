// filename: gen/generate.ts
import process from 'node:process';
import { resolveConfig, type ResolvedConfig } from '../src/config/chain';
import { emitTypes, type OnyxIntrospection, type EmitOptions, type OptionalStrategy } from './emit';
import { onyx } from '../src';
import type { SchemaEntity } from '../src/types/public';
import type { SchemaEntity } from '../src/types/public';

export interface GenerateOptions {
  /** Where to read schema from. */
  source?: 'auto' | 'api' | 'file';
  /** When source=file, filesystem path to schema JSON. */
  schemaPath?: string;

  /**
   * Output base filename (without extension). Default: "onyx.schema".
   * Used only when writing into a directory (see `typesOutDir`).
   */
  outBaseName?: string;

  /**
   * Types output directory (when writing into a directory).
   * Back-compat alias: `outDir`.
   * Note: if no output is provided, default output is "./onyx/types.ts".
   */
  typesOutDir?: string | string[];

  /**
   * Write the generated types to THIS EXACT FILE (absolute or relative path).
   * If provided and points to a ".ts" file, this takes precedence over `typesOutDir`.
   * Example: "./onyx/types.ts"
   * Note: if no output is provided, default output is "./onyx/types.ts".
   */
  typesOutFile?: string | string[];

  /**
   * JSON output directory (only used when `emitJson: true`).
   * Default: same as `typesOutDir` or the directory of `typesOutFile` (if set).
   */
  jsonOutDir?: string;

  /**
   * Emit a copy of the schema JSON alongside the TS file.
   * Default: false (do not copy schema).
   */
  emitJson?: boolean;

  /** Overwrite existing files. Default: true. */
  overwrite?: boolean;

  /** Timestamp representation for TS types. Default: "date". */
  timestampMode?: EmitOptions['timestampMode'];

  /** Exported schema type name. Default: "OnyxSchema". */
  schemaTypeName?: string;

  /** Prefix for model/interface names. Example: "Onyx" -> OnyxVodItem. Default: "" */
  prefix?: string;

  /**
   * Optional property strategy. Default: "non-null" (add `?` to non-null fields).
   * Other values: "nullable", "none".
   */
  optional?: OptionalStrategy;

  /** Optional candidate API paths (overrides defaults). Must start with "/". */
  apiPaths?: string[];

  /** Quiet logs. Default: false. */
  quiet?: boolean;

  /** @deprecated Legacy single outDir; still accepted to avoid breaking scripts. */
  outDir?: string | string[];
}

const DEFAULT_SCHEMA_PATH = './onyx.schema.json';
const DEFAULT_TYPES_OUT = './onyx/types.ts';

const DEFAULTS: Required<
  Omit<
    GenerateOptions,
    | 'schemaPath'
    | 'apiPaths'
    | 'typesOutDir'
    | 'jsonOutDir'
    | 'outDir'
    | 'prefix'
    | 'typesOutFile'
  >
> = {
  source: 'file',
  outBaseName: 'onyx.schema',
  emitJson: false,
  overwrite: true,
  timestampMode: 'date',
  schemaTypeName: 'OnyxSchema',
  optional: 'non-null',
  quiet: false,
};

function toArray(val?: string | string[]): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function isTypesFilePath(p?: string): boolean {
  if (!p) return false;
  return (
    p.endsWith('.ts') ||
    p.endsWith('.mts') ||
    p.endsWith('.cts') ||
    p.endsWith('.d.ts') ||
    p.endsWith('.d.mts') ||
    p.endsWith('.d.cts')
  );
}

async function readFileJson<T = unknown>(path: string): Promise<T> {
  const fs = await import('node:fs/promises');
  const txt = await fs.readFile(path, 'utf8');
  return JSON.parse(txt) as T;
}

async function ensureDir(dir: string): Promise<void> {
  const fs = await import('node:fs/promises');
  await fs.mkdir(dir, { recursive: true });
}

async function writeFile(path: string, data: string, overwrite: boolean): Promise<void> {
  const fs = await import('node:fs/promises');
  if (!overwrite) {
    try {
      await fs.access(path);
      throw new Error(`Refusing to overwrite existing file: ${path}`);
    } catch {
      /* not exists -> ok */
    }
  }
  await fs.writeFile(path, data, 'utf8');
}

function isIntrospection(x: unknown): x is OnyxIntrospection {
  return !!x && typeof x === 'object' && Array.isArray((x as { tables?: unknown }).tables);
}

function normalizeAttributeType(
  raw: unknown,
): OnyxIntrospection['tables'][number]['attributes'][number]['type'] {
  const t = typeof raw === 'string' ? raw : '';
  switch (t) {
    case 'String':
      return 'String';
    case 'Boolean':
      return 'Boolean';
    case 'Timestamp':
      return 'Timestamp';
    case 'EmbeddedList':
      return 'EmbeddedList';
    case 'EmbeddedObject':
      return 'EmbeddedObject';
    case 'Int':
    case 'Byte':
    case 'Short':
    case 'Float':
    case 'Double':
    case 'Long':
      return 'Int';
    default:
      return 'EmbeddedObject';
  }
}

function toOnyxIntrospectionFromEntities(entities: SchemaEntity[]): OnyxIntrospection {
  return {
    tables: entities.map((entity) => ({
      name: entity.name,
      attributes: (entity.attributes ?? []).map((attr) => ({
        name: attr.name,
        type: normalizeAttributeType(attr.type),
        isNullable: Boolean(attr.isNullable),
      })),
    })),
  };
}

function normalizeIntrospection(raw: unknown): OnyxIntrospection {
  if (isIntrospection(raw)) return raw;
  const entities = (raw as { entities?: unknown }).entities;
  if (Array.isArray(entities)) {
    return toOnyxIntrospectionFromEntities(entities as SchemaEntity[]);
  }
  throw new Error('Invalid schema: missing "tables" array.');
}

async function fetchSchemaFromApi(config: ResolvedConfig): Promise<OnyxIntrospection> {
  const db = onyx.init({
    baseUrl: config.baseUrl,
    databaseId: config.databaseId,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    fetch: config.fetch,
  });
  const schema = await db.getSchema();
  return normalizeIntrospection(schema);
}

/**
 * Programmatic codegen entry.
 * Returns the absolute paths of the generated files.
 */
export async function generateTypes(
  options?: GenerateOptions,
): Promise<{
  typesPath: string;
  jsonPath?: string;
  typesPaths: string[];
  jsonPaths?: string[];
}> {
  const path = await import('node:path');
  const opts = { ...DEFAULTS, ...(options ?? {}) };

  const resolvedSchemaPath =
    opts.schemaPath ?? (opts.source === 'file' ? DEFAULT_SCHEMA_PATH : undefined);

  let schemaInput: unknown | null = null;

  if (opts.source === 'file' || (opts.source === 'auto' && resolvedSchemaPath)) {
    if (!resolvedSchemaPath) throw new Error('schemaPath is required when source="file"');
    if (!opts.quiet)
      process.stderr.write(`[onyx-gen] reading schema from file: ${resolvedSchemaPath}\n`);
    schemaInput = await readFileJson<unknown>(resolvedSchemaPath);
  }

  if (!schemaInput) {
    if (opts.source === 'file') throw new Error('Failed to read schema from file');
    const cfg = await resolveConfig({});
    if (!cfg.databaseId) {
      throw new Error('Missing databaseId. Set ONYX_DATABASE_ID or pass to onyx.init().');
    }
    if (!opts.quiet)
      process.stderr.write(`[onyx-gen] fetching schema from API for db ${cfg.databaseId}\n`);
    schemaInput = await fetchSchemaFromApi(cfg);
  }

  const schema = normalizeIntrospection(schemaInput);

  const outTargets = [
    ...toArray(opts.typesOutFile),
    ...toArray(opts.typesOutDir),
    ...toArray(opts.outDir),
  ]
    .map((p) => p.trim())
    .filter(Boolean);

  if (outTargets.length === 0) {
    outTargets.push(DEFAULT_TYPES_OUT);
  }

  type OutputTarget = { typesPath: string; typesDirAbs: string; jsonBaseName: string };
  const outputs: OutputTarget[] = outTargets.map((target) => {
    const outIsFile = isTypesFilePath(target);
    const typesPath = outIsFile
      ? path.resolve(process.cwd(), target)
      : path.join(path.resolve(process.cwd(), target), `${opts.outBaseName}.ts`);
    const typesDirAbs = outIsFile ? path.dirname(typesPath) : path.resolve(process.cwd(), target);
    const jsonBaseName = outIsFile ? path.basename(typesPath, path.extname(typesPath)) : opts.outBaseName;
    return { typesPath, typesDirAbs, jsonBaseName };
  });

  const types = emitTypes(schema, {
    schemaTypeName: opts.schemaTypeName,
    timestampMode: opts.timestampMode,
    modelNamePrefix: opts.prefix ?? '',
    optionalStrategy: opts.optional,
  });
  const typesPaths: string[] = [];
  for (const out of outputs) {
    await ensureDir(out.typesDirAbs);
    await writeFile(out.typesPath, `${types}\n`, opts.overwrite);
    typesPaths.push(out.typesPath);
  }

  let jsonPaths: string[] | undefined;
  if (opts.emitJson) {
    const jsonPretty = JSON.stringify(schema, null, 2);
    jsonPaths = [];
    for (const out of outputs) {
      const jsonOutDirAbs = path.resolve(process.cwd(), opts.jsonOutDir ?? out.typesDirAbs);
      await ensureDir(jsonOutDirAbs);
      const jsonPath = path.join(jsonOutDirAbs, `${out.jsonBaseName}.json`);
      await writeFile(jsonPath, `${jsonPretty}\n`, opts.overwrite);
      jsonPaths.push(jsonPath);
    }
  }

  if (!opts.quiet) {
    for (const p of typesPaths) {
      process.stderr.write(`[onyx-gen] wrote ${p}\n`);
    }
    if (jsonPaths) {
      for (const jp of jsonPaths) {
        process.stderr.write(`[onyx-gen] wrote ${jp}\n`);
      }
    }
  }

  return { typesPath: typesPaths[0], jsonPath: jsonPaths?.[0], typesPaths, jsonPaths };
}
