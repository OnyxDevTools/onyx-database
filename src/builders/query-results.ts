/**
 * Array-like container for paginated query results. Provides helper methods
 * to traverse and aggregate records across pages.
 *
 * @example
 * ```ts
 * const results = new QueryResults(users, nextToken, fetchNext);
 * const firstUser = results.first();
 * ```
 */
export type QueryResultsPromise<T> = Promise<QueryResults<T>> & {
  [K in keyof QueryResults<T> as QueryResults<T>[K] extends (...args: any[]) => any ? K : never]:
    QueryResults<T>[K] extends (...args: infer P) => infer R ? (...args: P) => Promise<Awaited<R>> : never;
};

export class QueryResults<T> extends Array<T> {
  /** Token for the next page of results or null. */
  nextPage: string | null;
  private readonly fetcher?: (token: string) => Promise<QueryResults<T>>;

  /**
    * @param records - Records in the current page.
    * @param nextPage - Token representing the next page.
    * @param fetcher - Function used to fetch the next page when needed.
    * @example
    * ```ts
    * const results = new QueryResults(users, token, t => fetchMore(t));
    * ```
    */
  constructor(records: T[], nextPage: string | null, fetcher?: (token: string) => Promise<QueryResults<T>>) {
    super(...records);
    Object.setPrototypeOf(this, new.target.prototype);
    this.nextPage = nextPage;
    this.fetcher = fetcher;
  }

  /**
   * Returns the first record in the result set.
   * @throws Error if the result set is empty.
   * @example
   * ```ts
   * const user = results.first();
   * ```
   */
  first(): T {
    if (this.length === 0) throw new Error('QueryResults is empty');
    return this[0];
  }

  /**
   * Returns the first record or `null` if the result set is empty.
   * @example
   * ```ts
   * const user = results.firstOrNull();
   * ```
   */
  firstOrNull(): T | null {
    return this.length > 0 ? this[0] : null;
  }

  /**
   * Checks whether the current page has no records.
   * @example
   * ```ts
   * if (results.isEmpty()) console.log('no data');
   * ```
   */
  isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * Number of records on the current page.
   * @example
   * ```ts
   * console.log(results.size());
   * ```
   */
  size(): number {
    return this.length;
  }

  /**
   * Iterates over each record on the current page only.
   * @param action - Function to invoke for each record.
   * @example
   * ```ts
   * results.forEachOnPage(u => console.log(u.id));
   * ```
   */
  forEachOnPage(action: (item: T) => void): void {
    this.forEach(action);
  }

  /**
   * Iterates over every record across all pages sequentially.
   * @param action - Function executed for each record. Returning `false`
   *                 stops iteration early.
   * @example
   * ```ts
   * await results.forEachAll(u => {
   *   if (u.disabled) return false;
   * });
   * ```
   */
  async forEachAll(action: (item: T) => boolean | void | Promise<boolean | void>): Promise<void> {
    await this.forEachPage(async records => {
      for (const r of records) {
        const res = await action(r);
        if (res === false) return false;
      }
      return true;
    });
  }

  /**
   * Iterates page by page across the result set.
   * @param action - Function invoked with each page of records. Returning
   *                 `false` stops iteration.
   * @example
   * ```ts
   * await results.forEachPage(page => {
   *   console.log(page.length);
   * });
   * ```
   */
  async forEachPage(action: (records: T[]) => boolean | void | Promise<boolean | void>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let page: QueryResults<T> | null = this;
    while (page) {
      const cont = await action(Array.from(page));
      if (cont === false) return;
      if (page.nextPage && page.fetcher) {
        page = await page.fetcher(page.nextPage);
      } else {
        page = null;
      }
    }
  }

  /**
   * Collects all records from every page into a single array.
   * @returns All records.
   * @example
   * ```ts
   * const allUsers = await results.getAllRecords();
   * ```
   */
  async getAllRecords(): Promise<T[]> {
    const all: T[] = [];
    await this.forEachPage(records => {
      all.push(...records);
    });
    return all;
  }

  /**
   * Filters all records using the provided predicate.
   * @param predicate - Function used to test each record.
   * @example
   * ```ts
   * const enabled = await results.filterAll(u => u.enabled);
   * ```
   */
  async filterAll(predicate: (record: T) => boolean): Promise<T[]> {
    const all = await this.getAllRecords();
    return all.filter(predicate);
  }

  /**
   * Maps all records using the provided transform.
   * @param transform - Mapping function.
   * @example
   * ```ts
   * const names = await results.mapAll(u => u.name);
   * ```
   */
  async mapAll<R>(transform: (record: T) => R): Promise<R[]> {
    const all = await this.getAllRecords();
    return all.map(transform);
  }

  /**
   * Extracts values for a field across all records.
   * @param field - Name of the field to pluck.
   * @example
   * ```ts
   * const ids = await results.values('id');
   * ```
   */
  // @ts-expect-error overriding Array#values
  async values<K extends keyof T>(field: K): Promise<Array<T[K]>> {
    const all = await this.getAllRecords();
    return all.map(r => r[field]);
  }

  /**
   * Maximum value produced by the selector across all records.
   * @param selector - Function extracting a numeric value.
   * @example
   * ```ts
   * const maxAge = await results.maxOfDouble(u => u.age);
   * ```
   */
  async maxOfDouble(selector: (record: T) => number): Promise<number> {
    const all = await this.getAllRecords();
    return all.reduce((max, r) => Math.max(max, selector(r)), -Infinity);
  }

  /**
   * Minimum value produced by the selector across all records.
   * @param selector - Function extracting a numeric value.
   * @example
   * ```ts
   * const minAge = await results.minOfDouble(u => u.age);
   * ```
   */
  async minOfDouble(selector: (record: T) => number): Promise<number> {
    const all = await this.getAllRecords();
    return all.reduce((min, r) => Math.min(min, selector(r)), Infinity);
  }

  /**
   * Sum of values produced by the selector across all records.
   * @param selector - Function extracting a numeric value.
   * @example
   * ```ts
   * const total = await results.sumOfDouble(u => u.score);
   * ```
   */
  async sumOfDouble(selector: (record: T) => number): Promise<number> {
    const all = await this.getAllRecords();
    return all.reduce((sum, r) => sum + selector(r), 0);
  }

  /**
   * Maximum float value from the selector.
   * @param selector - Function extracting a numeric value.
   */
  async maxOfFloat(selector: (record: T) => number): Promise<number> {
    return this.maxOfDouble(selector);
  }
  /**
   * Minimum float value from the selector.
   * @param selector - Function extracting a numeric value.
   */
  async minOfFloat(selector: (record: T) => number): Promise<number> {
    return this.minOfDouble(selector);
  }
  /**
   * Sum of float values from the selector.
   * @param selector - Function extracting a numeric value.
   */
  async sumOfFloat(selector: (record: T) => number): Promise<number> {
    return this.sumOfDouble(selector);
  }
  /**
   * Maximum integer value from the selector.
   * @param selector - Function extracting a numeric value.
   */
  async maxOfInt(selector: (record: T) => number): Promise<number> {
    return this.maxOfDouble(selector);
  }
  /**
   * Minimum integer value from the selector.
   * @param selector - Function extracting a numeric value.
   */
  async minOfInt(selector: (record: T) => number): Promise<number> {
    return this.minOfDouble(selector);
  }
  /**
   * Sum of integer values from the selector.
   * @param selector - Function extracting a numeric value.
   */
  async sumOfInt(selector: (record: T) => number): Promise<number> {
    return this.sumOfDouble(selector);
  }
  /**
   * Maximum long value from the selector.
   * @param selector - Function extracting a numeric value.
   */
  async maxOfLong(selector: (record: T) => number): Promise<number> {
    return this.maxOfDouble(selector);
  }
  /**
   * Minimum long value from the selector.
   * @param selector - Function extracting a numeric value.
   */
  async minOfLong(selector: (record: T) => number): Promise<number> {
    return this.minOfDouble(selector);
  }
  /**
   * Sum of long values from the selector.
   * @param selector - Function extracting a numeric value.
   */
  async sumOfLong(selector: (record: T) => number): Promise<number> {
    return this.sumOfDouble(selector);
  }

  /**
   * Sum of bigint values from the selector.
   * @param selector - Function extracting a bigint value.
   * @example
   * ```ts
   * const total = await results.sumOfBigInt(u => u.balance);
   * ```
   */
  async sumOfBigInt(selector: (record: T) => bigint): Promise<bigint> {
    const all = await this.getAllRecords();
    return all.reduce((sum, r) => sum + selector(r), 0n);
  }

  /**
   * Executes an action for each page in parallel.
   * @param action - Function executed for each record concurrently.
   * @example
   * ```ts
   * await results.forEachPageParallel(async u => sendEmail(u));
   * ```
   */
  async forEachPageParallel(action: (item: T) => void | Promise<void>): Promise<void> {
    await this.forEachPage(records => Promise.all(records.map(action)).then(() => true));
  }
}

export default QueryResults;
