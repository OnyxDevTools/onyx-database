#!/usr/bin/env node
// filename: gen/cli/generate.ts
import process from 'node:process';
import { generateTypes, type GenerateOptions } from '../generate';

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

type OutCollector = {
  typesOutFile?: string | string[];
  typesOutDir?: string | string[];
};

function appendVal(current: string | string[] | undefined, val: string): string | string[] {
  if (!current) return val;
  return Array.isArray(current) ? [...current, val] : [current, val];
}

function addOut(
  opts: OutCollector,
  raw: string | undefined,
  forceFile = false,
): OutCollector {
  if (!raw) throw new Error('Missing value for output flag');
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  for (const val of parts) {
    if (forceFile || isTypesFilePath(val)) {
      opts.typesOutFile = appendVal(opts.typesOutFile, val);
    } else {
      opts.typesOutDir = appendVal(opts.typesOutDir, val);
    }
  }
  return opts;
}

function parseArgs(argv: string[]): GenerateOptions {
  const opts: GenerateOptions = {};
  const next = (i: number) => argv[i + 1];

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--out':
      case '--outDir': { // legacy alias
        addOut(opts, next(i));
        i++;
        break;
      }
      case '--types-out':
      case '--typesOut': {
        addOut(opts, next(i));
        i++;
        break;
      }
      case '--types-file':
      case '--typesFile': {
        addOut(opts, next(i), true);
        i++;
        break;
      }
      case '--json-out':
      case '--jsonOut':
        opts.jsonOutDir = next(i);
        i++;
        break;
      case '--base':
      case '--baseName':
        opts.outBaseName = next(i);
        i++;
        break;
      case '--schema':
        opts.schemaPath = next(i);
        i++;
        break;
      case '--source': {
        const v = (next(i) ?? '').toLowerCase();
        if (v === 'api' || v === 'file' || v === 'auto') opts.source = v as GenerateOptions['source'];
        else throw new Error(`Invalid --source: ${v}`);
        i++;
        break;
      }
      case '--timestamps': {
        const v = (next(i) ?? '').toLowerCase();
        if (v === 'string' || v === 'date' || v === 'number') opts.timestampMode = v as GenerateOptions['timestampMode'];
        else throw new Error(`Invalid --timestamps: ${v}`);
        i++;
        break;
      }
      case '--name':
      case '--schemaTypeName':
        opts.schemaTypeName = next(i);
        i++;
        break;
      case '--prefix':
        opts.prefix = next(i);
        i++;
        break;
      case '--optional': {
        const v = (next(i) ?? '').toLowerCase();
        if (v === 'non-null' || v === 'nonnull' || v === 'nonull') {
          opts.optional = 'non-null';
        } else if (v === 'nullable') {
          opts.optional = 'nullable';
        } else if (v === 'none') {
          opts.optional = 'none';
        } else {
          throw new Error(`Invalid --optional: ${v} (use non-null|nullable|none)`);
        }
        i++;
        break;
      }
      case '--emit-json':
        opts.emitJson = true;
        break;
      case '--no-emit-json':
        opts.emitJson = false;
        break;
      case '--api-path': {
        const v = next(i);
        if (!v || !v.startsWith('/')) throw new Error(`--api-path must start with "/": ${v}`);
        if (!opts.apiPaths) opts.apiPaths = [];
        opts.apiPaths.push(v);
        i++;
        break;
      }
      case '--overwrite':
        opts.overwrite = true;
        break;
      case '--no-overwrite':
        opts.overwrite = false;
        break;
      case '-q':
      case '--quiet':
        opts.quiet = true;
        break;
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        if (a.startsWith('-')) throw new Error(`Unknown option: ${a}`);
        break;
    }
  }
  return opts;
}

function printHelp(): void {
  process.stdout.write(`onyx-gen — Generate Onyx schema TypeScript types

Usage:
  onyx-gen [options]

Output selection:
  --out <path[,path2,...]>         If a value ends with ".ts", writes exactly to that file.
                                   Otherwise treats it as a directory. Comma-separate or repeat to
                                   write multiple outputs. Default: ./onyx/types.ts
  --types-out <dir|file>[,more]    Same as --out (file-or-dir).
  --types-file <file.ts>[,more]    Explicit file output(s).
  --base, --baseName <name>        Base filename (without ext) when writing to a directory (default: onyx.schema)
  --json-out <dir>                 JSON output directory (used only with --emit-json)

Source selection:
  --source <auto|api|file>         Where to get schema (default: file)
  --schema <path>                  Path to schema JSON when --source=file (default: ./onyx.schema.json)

Type emission:
  --timestamps <string|date|number>  Timestamp representation in types (default: date)
  --name, --schemaTypeName <T>       Exported schema type name (default: OnyxSchema)
  --prefix <Prefix>                  Prefix to prepend to generated model names (default: none)
  --optional <non-null|nullable|none>
                                     Where to add '?' optional props (default: non-null)

Other:
  --emit-json / --no-emit-json     Emit schema JSON copy (default: no-emit-json)
  --api-path <path>                Candidate API path to fetch schema; can be repeated
  --overwrite / --no-overwrite     Overwrite existing files (default: overwrite)
  -q, --quiet                      Suppress logs
  -h, --help                       Show this help

Notes:
  • Running with no flags defaults to: --source file --schema ./onyx.schema.json --out ./onyx/types.ts
  • Env/config for --source=api uses the same resolver as onyx.init()
    (env vars, ./onyx-database.json, ~/.onyx/onyx-database-<id>.json, etc.).
`);
}

(async () => {
  try {
    const opts = parseArgs(process.argv);
    await generateTypes(opts);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    process.stderr.write(`onyx-gen: ${msg}\n`);
    process.exit(1);
  }
})();
