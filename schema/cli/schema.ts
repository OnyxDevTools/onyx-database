#!/usr/bin/env node
// filename: schema/cli/schema.ts
import path from 'node:path';
import process from 'node:process';
import { onyx } from '../../src';
import type { SchemaUpsertRequest } from '../../src/types/public';

const DEFAULT_SCHEMA_PATH = './onyx.schema.json';

type Command = 'publish' | 'get' | 'validate' | 'help';

type ParsedArgs = {
  command: Command;
  filePath: string;
  tables?: string[];
};

function printHelp(): void {
  process.stdout.write(`onyx-schema — Manage Onyx database schemas via API

Usage:
  onyx-schema publish [file]
  onyx-schema get [file] [--tables tableA,tableB]
  onyx-schema validate [file]

Options:
  [file]                 Path to schema JSON (default: ./onyx.schema.json)
  --tables <list>        Comma-separated list of tables to fetch (for get)
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
  if (cmd === 'publish' || cmd === 'get' || cmd === 'validate') {
    command = cmd;
  }

  let idx = 3;
  let filePath = DEFAULT_SCHEMA_PATH;
  if (argv[idx] && !argv[idx].startsWith('-')) {
    filePath = argv[idx];
    idx++;
  }

  let tables: string[] | undefined;

  for (; idx < argv.length; idx++) {
    const arg = argv[idx];
    switch (arg) {
      case '--tables':
        tables = parseTables(argv[idx + 1]);
        idx++;
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

  return { command, filePath, tables };
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

async function fetchSchema(filePath: string, tables?: string[]): Promise<void> {
  const db = onyx.init();
  const schema = await db.getSchema({ tables });
  if (tables?.length) {
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

(async () => {
  try {
    const parsed = parseArgs(process.argv);
    switch (parsed.command) {
      case 'publish':
        await publishSchema(parsed.filePath);
        break;
      case 'get':
        await fetchSchema(parsed.filePath, parsed.tables);
        break;
      case 'validate':
        await validateSchema(parsed.filePath);
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
