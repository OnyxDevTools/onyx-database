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

function parseArgs(argv: string[]): GenerateOptions {
  const opts: GenerateOptions = {};
  const next = (i: number) => argv[i + 1];

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--out':
      case '--outDir': { // legacy alias
        const val = next(i);
        if (!val) throw new Error(`Missing value for ${a}`);
        if (isTypesFilePath(val)) opts.typesOutFile = val;
        else opts.typesOutDir = val;
        i++;
        break;
      }
      case '--types-out':
      case '--typesOut': {
        const val = next(i);
        if (!val) throw new Error(`Missing value for ${a}`);
        if (isTypesFilePath(val)) opts.typesOutFile = val;
        else opts.typesOutDir = val;
        i++;
        break;
      }
      case '--types-file':
      case '--typesFile': {
        const val = next(i);
        if (!val) throw new Error(`Missing value for ${a}`);
        opts.typesOutFile = val;
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
  --out <path>                     If <path> ends with ".ts", writes exactly to that file.
                                   Otherwise treats <path> as a directory.
  --types-out <dir|file>           Same as --out (file-or-dir).
  --types-file <file.ts>           Explicit file output.
  --base, --baseName <name>        Base filename (without ext) when writing to a directory (default: onyx.schema)
  --json-out <dir>                 JSON output directory (used only with --emit-json)

Source selection:
  --source <auto|api|file>         Where to get schema (default: auto)
  --schema <path>                  Path to schema JSON when --source=file (or to force local)

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
