export interface TableFormatOptions {
  /**
   * Whether to render a header row. Defaults to `true`.
   */
  headers?: boolean;
  /**
   * Maximum width for each rendered column. Defaults to `80`.
   */
  maxColumnWidth?: number;
  /**
   * When true, nested objects expand into additional dot-notated columns.
   * Defaults to `false`.
   */
  flattenNestedObjects?: boolean;
  /**
   * Separator used when flattening nested object keys. Defaults to `.`.
   */
  nestedSeparator?: string;
  /**
   * Display value used for `null` and `undefined`. Defaults to an empty string.
   */
  nullValue?: string;
}

export interface TreeFormatOptions {
  /**
   * Label used for the root node when `includeRoot` is true. Defaults to `results`.
   */
  rootLabel?: string;
  /**
   * Field whose value should label each record node.
   */
  keyField?: string;
  /**
   * Whether to include a root node. Defaults to `true`.
   */
  includeRoot?: boolean;
  /**
   * Maximum nesting depth to expand before rendering remaining values inline.
   * Defaults to `Infinity`.
   */
  maxDepth?: number;
  /**
   * Display value used for `null` and `undefined`. Defaults to an empty string.
   */
  nullValue?: string;
}

export interface CsvFormatOptions {
  /**
   * Whether to render a header row. Defaults to `true`.
   */
  headers?: boolean;
  /**
   * Field delimiter. Defaults to `,`.
   */
  delimiter?: string;
  /**
   * Quote character. Defaults to `"`.
   */
  quote?: string;
  /**
   * Escape character used to escape embedded quotes. Defaults to `"`.
   */
  escape?: string;
  /**
   * Line ending. Defaults to `\n`.
   */
  newline?: '\n' | '\r\n';
  /**
   * When true, nested objects expand into additional dot-notated columns.
   * Defaults to `true`.
   */
  flattenNestedObjects?: boolean;
  /**
   * Separator used when flattening nested object keys. Defaults to `.`.
   */
  nestedSeparator?: string;
  /**
   * Display value used for `null` and `undefined`. Defaults to an empty string.
   */
  nullValue?: string;
}

export interface JsonFormatOptions {
  /**
   * Whether to pretty-print the JSON output. Defaults to `true`.
   */
  pretty?: boolean;
  /**
   * Indentation size used when `pretty` is true. Defaults to `2`.
   */
  indent?: number;
}
