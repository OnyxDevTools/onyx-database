import type {
  CsvFormatOptions,
  JsonFormatOptions,
  TableFormatOptions,
  TreeFormatOptions,
} from '../types/formatters';

type QueryRecord = Record<string, unknown>;
type FlatRow = Record<string, unknown>;

const DEFAULT_TABLE_OPTIONS: Required<TableFormatOptions> = {
  headers: true,
  maxColumnWidth: 80,
  flattenNestedObjects: false,
  nestedSeparator: '.',
  nullValue: '',
};

const DEFAULT_TREE_OPTIONS: Required<TreeFormatOptions> = {
  rootLabel: 'results',
  keyField: '',
  includeRoot: true,
  maxDepth: Number.POSITIVE_INFINITY,
  nullValue: '',
};

const DEFAULT_CSV_OPTIONS: Required<CsvFormatOptions> = {
  headers: true,
  delimiter: ',',
  quote: '"',
  escape: '"',
  newline: '\n',
  flattenNestedObjects: true,
  nestedSeparator: '.',
  nullValue: '',
};

const DEFAULT_JSON_OPTIONS: Required<JsonFormatOptions> = {
  pretty: true,
  indent: 2,
};

function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

function isRecord(value: unknown): value is QueryRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !isDate(value);
}

function normalizeRecord(value: unknown): QueryRecord {
  if (isRecord(value)) {
    return value;
  }
  return { value };
}

function normalizeScalar(value: unknown, nullValue: string): string {
  if (value == null) return nullValue;
  if (isDate(value)) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function inlineValue(value: unknown, nullValue: string): string {
  if (value == null) return nullValue;
  if (isDate(value)) return value.toISOString();
  if (Array.isArray(value)) {
    return value.length === 0
      ? '[]'
      : `[${value.map(entry => inlineValue(entry, nullValue)).join(', ')}]`;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, entry]) => `${key}=${inlineValue(entry, nullValue)}`)
      .join(', ');
  }
  if (typeof value === 'bigint') return value.toString();
  return String(value);
}

function escapeTableCell(value: string): string {
  return value
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function truncate(value: string, maxWidth: number): string {
  if (maxWidth < 1) return '';
  if (value.length <= maxWidth) return value;
  if (maxWidth <= 3) return '.'.repeat(maxWidth);
  return `${value.slice(0, Math.max(0, maxWidth - 3))}...`;
}

function padRight(value: string, width: number): string {
  if (value.length >= width) return value;
  return value + ' '.repeat(width - value.length);
}

function flattenValue(
  value: unknown,
  separator: string,
  prefix: string,
  out: FlatRow,
): void {
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      out[prefix] = {};
      return;
    }
    for (const [key, entry] of entries) {
      const path = prefix ? `${prefix}${separator}${key}` : key;
      flattenValue(entry, separator, path, out);
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      out[prefix] = [];
      return;
    }
    value.forEach((entry, index) => {
      const path = prefix ? `${prefix}${separator}${index}` : String(index);
      flattenValue(entry, separator, path, out);
    });
    return;
  }
  out[prefix] = value;
}

function toFlatRow(record: QueryRecord, separator: string): FlatRow {
  const out: FlatRow = {};
  for (const [key, value] of Object.entries(record)) {
    flattenValue(value, separator, key, out);
  }
  return out;
}

function discoveredColumns(rows: FlatRow[]): string[] {
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  return columns;
}

function orderColumns(
  discovered: string[],
  preferred: string[] | undefined,
  flattenNestedObjects: boolean,
  separator: string,
): string[] {
  if (!preferred || preferred.length === 0) return discovered;

  const ordered: string[] = [];
  const seen = new Set<string>();
  const addColumn = (column: string): void => {
    if (!seen.has(column)) {
      seen.add(column);
      ordered.push(column);
    }
  };

  for (const field of preferred) {
    if (flattenNestedObjects) {
      let matched = false;
      for (const column of discovered) {
        if (column === field || column.startsWith(`${field}${separator}`)) {
          addColumn(column);
          matched = true;
        }
      }
      if (!matched) {
        addColumn(field);
      }
      continue;
    }
    addColumn(field);
  }

  for (const column of discovered) {
    addColumn(column);
  }

  return ordered;
}

function normalizeTableRows(
  records: unknown[],
  preferredColumns: string[] | undefined,
  options: Required<TableFormatOptions>,
): { columns: string[]; rows: string[][] } {
  const normalized = records.map(normalizeRecord);
  if (options.flattenNestedObjects) {
    const flatRows = normalized.map(record => toFlatRow(record, options.nestedSeparator));
    const columns = orderColumns(
      discoveredColumns(flatRows),
      preferredColumns,
      true,
      options.nestedSeparator,
    );
    const rows = flatRows.map(row => columns.map(column => escapeTableCell(truncate(
      inlineValue(row[column], options.nullValue),
      options.maxColumnWidth,
    ))));
    return { columns, rows };
  }

  const topLevelRows = normalized.map(record => ({ ...record }));
  const columns = orderColumns(
    discoveredColumns(topLevelRows),
    preferredColumns,
    false,
    options.nestedSeparator,
  );
  const rows = topLevelRows.map(row => columns.map(column => escapeTableCell(truncate(
    inlineValue(row[column], options.nullValue),
    options.maxColumnWidth,
  ))));
  return { columns, rows };
}

export function formatQueryResultsAsTable(
  records: unknown[],
  options?: TableFormatOptions,
  preferredColumns?: string[],
): string {
  const final = { ...DEFAULT_TABLE_OPTIONS, ...options };
  const { columns, rows } = normalizeTableRows(records, preferredColumns, final);
  if (columns.length === 0) return '';

  const headerCells = columns.map(column => truncate(column, final.maxColumnWidth));
  const widths = columns.map((_, index) => {
    const headerWidth = final.headers ? headerCells[index].length : 0;
    const rowWidth = rows.reduce((max, row) => Math.max(max, row[index].length), 0);
    return Math.max(headerWidth, rowWidth);
  });

  const border = (left: string, join: string, right: string): string =>
    `${left}${widths.map(width => '─'.repeat(width + 2)).join(join)}${right}`;
  const renderRow = (cells: string[]): string =>
    `│ ${cells.map((cell, index) => padRight(cell, widths[index])).join(' │ ')} │`;

  const lines: string[] = [border('┌', '┬', '┐')];
  if (final.headers) {
    lines.push(renderRow(headerCells));
    lines.push(border('├', '┼', '┤'));
  }
  for (const row of rows) {
    lines.push(renderRow(row));
  }
  lines.push(border('└', '┴', '┘'));
  return lines.join('\n');
}

function encodeCsvCell(value: string, options: Required<CsvFormatOptions>): string {
  const escapedQuote = `${options.escape}${options.quote}`;
  const escaped = value.split(options.quote).join(escapedQuote);
  const needsQuoting = escaped.includes(options.delimiter)
    || escaped.includes(options.quote)
    || escaped.includes('\n')
    || escaped.includes('\r');
  if (!needsQuoting) return escaped;
  return `${options.quote}${escaped}${options.quote}`;
}

function normalizeCsvRows(
  records: unknown[],
  preferredColumns: string[] | undefined,
  options: Required<CsvFormatOptions>,
): { columns: string[]; rows: string[][] } {
  const normalized = records.map(normalizeRecord);
  if (options.flattenNestedObjects) {
    const flatRows = normalized.map(record => toFlatRow(record, options.nestedSeparator));
    const columns = orderColumns(
      discoveredColumns(flatRows),
      preferredColumns,
      true,
      options.nestedSeparator,
    );
    const rows = flatRows.map(row => columns.map(column => normalizeScalar(row[column], options.nullValue)));
    return { columns, rows };
  }

  const topLevelRows = normalized.map(record => ({ ...record }));
  const columns = orderColumns(
    discoveredColumns(topLevelRows),
    preferredColumns,
    false,
    options.nestedSeparator,
  );
  const rows = topLevelRows.map(row => columns.map(column => inlineValue(row[column], options.nullValue)));
  return { columns, rows };
}

export function formatQueryResultsAsCsv(
  records: unknown[],
  options?: CsvFormatOptions,
  preferredColumns?: string[],
): string {
  const final = { ...DEFAULT_CSV_OPTIONS, ...options };
  const { columns, rows } = normalizeCsvRows(records, preferredColumns, final);
  const lines: string[] = [];

  if (final.headers && columns.length > 0) {
    lines.push(columns.map(column => encodeCsvCell(column, final)).join(final.delimiter));
  }

  for (const row of rows) {
    lines.push(row.map(cell => encodeCsvCell(cell, final)).join(final.delimiter));
  }

  return lines.join(final.newline);
}

function normalizeJsonValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (isDate(value)) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(entry => normalizeJsonValue(entry));
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = normalizeJsonValue(entry);
    }
    return out;
  }
  return value;
}

export function formatQueryResultsAsJson(records: unknown[], options?: JsonFormatOptions): string {
  const final = { ...DEFAULT_JSON_OPTIONS, ...options };
  const normalized = records.map(record => normalizeJsonValue(normalizeRecord(record)));
  return final.pretty
    ? JSON.stringify(normalized, null, final.indent)
    : JSON.stringify(normalized);
}

interface TreeNode {
  label: string;
  children?: TreeNode[];
}

function findDefaultTreeKeyField(record: QueryRecord): string | undefined {
  for (const candidate of ['code', 'id', 'name']) {
    if (candidate in record) return candidate;
  }
  const keys = Object.keys(record);
  return keys.length > 0 ? keys[0] : undefined;
}

function buildTreeNodesFromValue(
  value: QueryRecord | unknown[],
  options: Required<TreeFormatOptions>,
  depth: number,
): TreeNode[] {
  if (depth >= options.maxDepth) {
    return [{ label: inlineValue(value, options.nullValue) }];
  }
  if (Array.isArray(value)) {
    return value.map((entry, index) => {
      if (!isRecord(entry) && !Array.isArray(entry)) {
        return { label: `[${index}]: ${inlineValue(entry, options.nullValue)}` };
      }
      return {
        label: `[${index}]`,
        children: buildTreeNodesFromValue(entry, options, depth + 1),
      };
    });
  }
  return Object.entries(value).map(([key, entry]) => {
    if (isRecord(entry) || Array.isArray(entry)) {
      if (depth + 1 >= options.maxDepth) {
        return { label: `${key}: ${inlineValue(entry, options.nullValue)}` };
      }
      return {
        label: key,
        children: buildTreeNodesFromValue(entry, options, depth + 1),
      };
    }
    return { label: `${key}: ${inlineValue(entry, options.nullValue)}` };
  });
}

function buildRecordTreeNode(
  record: QueryRecord,
  index: number,
  options: Required<TreeFormatOptions>,
): TreeNode {
  const keyField = options.keyField || findDefaultTreeKeyField(record);
  const entries = Object.entries(record);
  if (!keyField || !(keyField in record)) {
    return {
      label: `row ${index + 1}`,
      children: buildTreeNodesFromValue(record, options, 0),
    };
  }

  const labelValue = inlineValue(record[keyField], options.nullValue);
  const childEntries = entries.filter(([key]) => key !== keyField);
  return {
    label: labelValue,
    children: childEntries.length > 0
      ? childEntries.map(([key, value]) => {
        if (isRecord(value) || Array.isArray(value)) {
          if (1 > options.maxDepth) {
            return { label: `${key}: ${inlineValue(value, options.nullValue)}` };
          }
          return {
            label: key,
            children: buildTreeNodesFromValue(value, options, 1),
          };
        }
        return { label: `${key}: ${inlineValue(value, options.nullValue)}` };
      })
      : undefined,
  };
}

function renderTreeNodes(nodes: TreeNode[], prefix = ''): string[] {
  const lines: string[] = [];
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const branch = isLast ? '└─ ' : '├─ ';
    lines.push(`${prefix}${branch}${node.label}`);
    if (node.children && node.children.length > 0) {
      const childPrefix = `${prefix}${isLast ? '   ' : '│  '}`;
      lines.push(...renderTreeNodes(node.children, childPrefix));
    }
  });
  return lines;
}

export function formatQueryResultsAsTree(records: unknown[], options?: TreeFormatOptions): string {
  const final = { ...DEFAULT_TREE_OPTIONS, ...options };
  const nodes = records.map((record, index) => buildRecordTreeNode(normalizeRecord(record), index, final));
  if (!final.includeRoot) {
    return renderTreeNodes(nodes).join('\n');
  }
  const lines = [final.rootLabel];
  if (nodes.length > 0) {
    lines.push(...renderTreeNodes(nodes));
  }
  return lines.join('\n');
}

export interface QueryPageLike<T> {
  records?: T[] | null;
  nextPage?: string | null;
}

export async function collectAllQueryRecords<T>(
  getPage: (nextPage?: string) => Promise<QueryPageLike<T>>,
  initialNextPage?: string,
): Promise<T[]> {
  const records: T[] = [];
  let nextPage = initialNextPage;

  while (true) {
    const page = await getPage(nextPage);
    if (Array.isArray(page.records)) {
      records.push(...page.records);
    }
    if (!page.nextPage) break;
    nextPage = page.nextPage;
  }

  return records;
}
