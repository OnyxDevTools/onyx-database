// filename: gen/generate.ts
import process from 'node:process';
import { resolveConfig } from '../src/config/chain';
import { HttpClient } from '../src/core/http';
import { emitTypes, type OnyxIntrospection, type EmitOptions, type OptionalStrategy } from './emit';

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
   * Default: "generated". Back-compat alias: `outDir`.
   */
  typesOutDir?: string;

  /**
   * Write the generated types to THIS EXACT FILE (absolute or relative path).
   * If provided and points to a ".ts" file, this takes precedence over `typesOutDir`.
   * Example: "./onyx/types.ts"
   */
  typesOutFile?: string;

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
  outDir?: string;
}

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
  source: 'auto',
  outBaseName: 'onyx.schema',
  emitJson: false,
  overwrite: true,
  timestampMode: 'date',
  schemaTypeName: 'OnyxSchema',
  optional: 'non-null',
  quiet: false,
};

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

async function fetchSchemaFromApi(
  http: HttpClient,
  databaseId: string,
  candidates?: string[],
): Promise<OnyxIntrospection> {
  const defaultCandidates = [
    `/schema/${encodeURIComponent(databaseId)}`,
    `/data/${encodeURIComponent(databaseId)}/schema`,
    `/meta/schema/${encodeURIComponent(databaseId)}`,
    `/schema?databaseId=${encodeURIComponent(databaseId)}`,
    `/meta/schema?databaseId=${encodeURIComponent(databaseId)}`,
  ];
  const paths = candidates && candidates.length ? candidates : defaultCandidates;

  let lastErr: unknown;
  for (const p of paths) {
    try {
      const res = await http.request<unknown>('GET', p);
      if (isIntrospection(res)) return res;
    } catch (e) {
      lastErr = e;
    }
  }
  const err = lastErr instanceof Error ? lastErr.message : String(lastErr ?? 'Unknown error');
  throw new Error(
    `Unable to fetch schema from API. Tried: ${paths.join(', ')}. Last error: ${err}`,
  );
}

/**
 * Programmatic codegen entry.
 * Returns the absolute paths of the generated files.
 */
export async function generateTypes(
  options?: GenerateOptions,
): Promise<{ typesPath: string; jsonPath?: string }> {
  const path = await import('node:path');
  const opts = { ...DEFAULTS, ...(options ?? {}) };

  // Back-compat: allow legacy outDir to set typesOutDir if not provided
  const typesDir = opts.typesOutDir ?? opts.outDir ?? 'generated';

  let schema: OnyxIntrospection | null = null;

  if (opts.source === 'file' || (opts.source === 'auto' && opts.schemaPath)) {
    if (!opts.schemaPath) throw new Error('schemaPath is required when source="file"');
    if (!opts.quiet)
      process.stderr.write(`[onyx-gen] reading schema from file: ${opts.schemaPath}\n`);
    schema = await readFileJson<OnyxIntrospection>(opts.schemaPath);
  }

  if (!schema) {
    if (opts.source === 'file') throw new Error('Failed to read schema from file');
    const cfg = await resolveConfig({});
    const http = new HttpClient({
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey,
      apiSecret: cfg.apiSecret,
      fetchImpl: cfg.fetch,
    });
    if (!opts.quiet)
      process.stderr.write(`[onyx-gen] fetching schema from API for db ${cfg.databaseId}\n`);
    schema = await fetchSchemaFromApi(http, cfg.databaseId, options?.apiPaths);
  }

  if (!isIntrospection(schema)) {
    throw new Error('Invalid schema: missing "tables" array.');
  }

  // Decide file-vs-dir for types
  const outIsFile =
    typeof opts.typesOutFile === 'string' &&
    (opts.typesOutFile.endsWith('.ts') ||
      opts.typesOutFile.endsWith('.mts') ||
      opts.typesOutFile.endsWith('.cts') ||
      opts.typesOutFile.endsWith('.d.ts') ||
      opts.typesOutFile.endsWith('.d.mts') ||
      opts.typesOutFile.endsWith('.d.cts'));

  let typesPath: string;
  let jsonBaseName: string; // used only when emitJson = true
  let typesDirAbs: string;

  if (outIsFile) {
    const typesOutFile = opts.typesOutFile as string;
    typesPath = path.resolve(process.cwd(), typesOutFile);
    typesDirAbs = path.dirname(typesPath);
    await ensureDir(typesDirAbs);
    jsonBaseName = path.basename(typesPath, path.extname(typesPath));
  } else {
    typesDirAbs = path.resolve(process.cwd(), typesDir);
    await ensureDir(typesDirAbs);
    typesPath = path.join(typesDirAbs, `${opts.outBaseName}.ts`);
    jsonBaseName = opts.outBaseName;
  }

  const types = emitTypes(schema, {
    schemaTypeName: opts.schemaTypeName,
    timestampMode: opts.timestampMode,
    modelNamePrefix: opts.prefix ?? '',
    optionalStrategy: opts.optional,
  });
  await writeFile(typesPath, `${types}\n`, opts.overwrite);

  let jsonPath: string | undefined;
  if (opts.emitJson) {
    const jsonOutDirAbs = path.resolve(
      process.cwd(),
      opts.jsonOutDir ?? (outIsFile ? typesDirAbs : typesDirAbs),
    );
    await ensureDir(jsonOutDirAbs);
    jsonPath = path.join(jsonOutDirAbs, `${jsonBaseName}.json`);
    const jsonPretty = JSON.stringify(schema, null, 2);
    await writeFile(jsonPath, `${jsonPretty}\n`, opts.overwrite);
  }

  if (!opts.quiet) {
    process.stderr.write(`[onyx-gen] wrote ${typesPath}\n`);
    if (jsonPath) process.stderr.write(`[onyx-gen] wrote ${jsonPath}\n`);
  }

  return { typesPath, jsonPath };
}
