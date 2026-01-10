#!/usr/bin/env node
// filename: schema/cli/schema.ts
import path from 'node:path';
import process from 'node:process';
import { onyx } from '../../src';
import { resolveConfigWithSource } from '../../src/config/chain';
import { formatSchemaDiff } from './diff';
import type { SchemaUpsertRequest } from '../../src/types/public';

const DEFAULT_SCHEMA_PATH = './onyx.schema.json';

type Command = 'publish' | 'get' | 'validate' | 'diff' | 'info' | 'help';

type ParsedArgs = {
  command: Command;
  filePath: string;
  tables?: string[];
  print?: boolean;
};

function printHelp(): void {
  process.stdout.write(`onyx-schema — Manage Onyx database schemas via API

Usage:
  onyx-schema publish [file]
  onyx-schema get [file] [--tables tableA,tableB]
  onyx-schema validate [file]
  onyx-schema diff [file]
  onyx-schema info

Options:
  [file]                 Path to schema JSON (default: ./onyx.schema.json)
  --tables <list>        Comma-separated list of tables to fetch (for get)
  --print                Print the fetched schema to stdout instead of writing a file
  -h, --help             Show this help message
`);
}

function parseTables(value?: string): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function parseArgs(argv: string[]): ParsedArgs {
  const cmd = (argv[2] ?? '').toLowerCase();
  let command: Command = 'help';
  if (cmd === 'publish' || cmd === 'get' || cmd === 'validate' || cmd === 'diff' || cmd === 'info') {
    command = cmd;
  }

  let idx = 3;
  let filePath = DEFAULT_SCHEMA_PATH;
  if (argv[idx] && !argv[idx].startsWith('-')) {
    filePath = argv[idx];
    idx++;
  }

  let tables: string[] | undefined;
  let print = false;

  for (; idx < argv.length; idx++) {
    const arg = argv[idx];
    switch (arg) {
      case '--tables':
        tables = parseTables(argv[idx + 1]);
        idx++;
        break;
      case '--print':
        print = true;
        break;
      case '-h':
      case '--help':
        command = 'help';
        break;
      default: {
        if (arg.startsWith('--tables=')) {
          tables = parseTables(arg.slice('--tables='.length));
          break;
        }
        if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
        break;
      }
    }
  }

  return { command, filePath, tables, print };
}

async function readFileJson<T = unknown>(filePath: string): Promise<T> {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
}

async function writeFileJson(filePath: string, data: unknown): Promise<void> {
  const fs = await import('node:fs/promises');
  const resolved = path.resolve(filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(resolved, serialized, 'utf8');
}

async function fetchSchema(filePath: string, tables?: string[], print?: boolean): Promise<void> {
  const db = onyx.init();
  const schema = await db.getSchema({ tables });
  if (tables?.length || print) {
    process.stdout.write(`${JSON.stringify(schema, null, 2)}\n`);
    return;
  }
  await writeFileJson(filePath, schema);
  process.stdout.write(`Schema written to ${filePath}.\n`);
}

function formatSchemaErrors(errors?: Array<{ message: string }>): string {
  if (!errors?.length) return 'Unknown validation error';
  return errors.map((err) => `- ${err.message}`).join('\n');
}

async function validateSchema(filePath: string): Promise<void> {
  const db = onyx.init();
  const schema = await readFileJson<SchemaUpsertRequest>(filePath);
  const result = await db.validateSchema(schema);
  if (!result.valid) {
    throw new Error(`Schema validation failed:\n${formatSchemaErrors(result.errors)}`);
  }
  process.stdout.write(`Schema at ${filePath} is valid.\n`);
}

async function publishSchema(filePath: string): Promise<void> {
  const db = onyx.init();
  const schema = await readFileJson<SchemaUpsertRequest>(filePath);
  const result = await db.validateSchema(schema);
  if (!result.valid) {
    throw new Error(`Schema validation failed:\n${formatSchemaErrors(result.errors)}`);
  }
  const revision = await db.updateSchema(schema, { publish: true });
  process.stdout.write(`Schema published for database ${revision.databaseId} from ${filePath}.\n`);
}

async function diffSchema(filePath: string): Promise<void> {
  const db = onyx.init();
  const localSchema = await readFileJson<SchemaUpsertRequest>(filePath);
  const diff = await db.diffSchema(localSchema);
  const output = formatSchemaDiff(diff, filePath);
  process.stdout.write(output);
}

function maskValue(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return value;
  return `${value.slice(0, 2)}...${value.slice(-2)}`;
}

function formatSource(source: string | undefined): string {
  if (!source) return 'unknown';
  if (source.includes('env')) return 'env';
  if (source.includes('file') || source.includes('profile') || source.includes('config')) return 'file';
  if (source === 'explicit config') return 'explicit';
  return source;
}

async function printInfo(): Promise<void> {
  const resolved = await resolveConfigWithSource();
  const db = onyx.init();

  const cfgFile =
    resolved.sources.configPath ??
    resolved.sources.projectFile ??
    resolved.sources.homeProfile ??
    '(none)';

  let connection = 'ok';
  try {
    await db.getSchema({ tables: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    connection = msg;
  }

  const lines = [
    `Database ID: ${resolved.databaseId} (source: ${formatSource(resolved.sources.databaseId)})`,
    `Base URL   : ${resolved.baseUrl} (source: ${formatSource(resolved.sources.baseUrl)})`,
    `API Key    : ${maskValue(resolved.apiKey)} (source: ${formatSource(resolved.sources.apiKey)})`,
    `API Secret : ${maskValue(resolved.apiSecret)} (source: ${formatSource(resolved.sources.apiSecret)})`,
    `Config file: ${cfgFile}`,
    `Connection : ${connection}`,
  ];

  process.stdout.write(`${lines.join('\n')}\n`);
}

(async () => {
  try {
    const parsed = parseArgs(process.argv);
    switch (parsed.command) {
      case 'publish':
        await publishSchema(parsed.filePath);
        break;
      case 'get':
        await fetchSchema(parsed.filePath, parsed.tables, parsed.print);
        break;
      case 'validate':
        await validateSchema(parsed.filePath);
        break;
      case 'diff':
        await diffSchema(parsed.filePath);
        break;
      case 'info':
        await printInfo();
        break;
      default:
        printHelp();
        return;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`onyx-schema: ${msg}\n`);
    process.exit(1);
  }
})();
