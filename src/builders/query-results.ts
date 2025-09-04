export class QueryResults<T> extends Array<T> {
  nextPage: string | null;
  private readonly fetcher?: (token: string) => Promise<QueryResults<T>>;

  constructor(records: T[], nextPage: string | null, fetcher?: (token: string) => Promise<QueryResults<T>>) {
    super(...records);
    Object.setPrototypeOf(this, new.target.prototype);
    this.nextPage = nextPage;
    this.fetcher = fetcher;
  }

  first(): T {
    if (this.length === 0) throw new Error('QueryResults is empty');
    return this[0];
  }

  firstOrNull(): T | null {
    return this.length > 0 ? this[0] : null;
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  size(): number {
    return this.length;
  }

  forEachOnPage(action: (item: T) => void): void {
    this.forEach(action);
  }

  async forEachAll(action: (item: T) => boolean | void | Promise<boolean | void>): Promise<void> {
    await this.forEachPage(async records => {
      for (const r of records) {
        const res = await action(r);
        if (res === false) return false;
      }
      return true;
    });
  }

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

  async getAllRecords(): Promise<T[]> {
    const all: T[] = [];
    await this.forEachPage(records => {
      all.push(...records);
    });
    return all;
  }

  async filterAll(predicate: (record: T) => boolean): Promise<T[]> {
    const all = await this.getAllRecords();
    return all.filter(predicate);
  }

  async mapAll<R>(transform: (record: T) => R): Promise<R[]> {
    const all = await this.getAllRecords();
    return all.map(transform);
  }

  async maxOfDouble(selector: (record: T) => number): Promise<number> {
    const all = await this.getAllRecords();
    return all.reduce((max, r) => Math.max(max, selector(r)), -Infinity);
  }

  async minOfDouble(selector: (record: T) => number): Promise<number> {
    const all = await this.getAllRecords();
    return all.reduce((min, r) => Math.min(min, selector(r)), Infinity);
  }

  async sumOfDouble(selector: (record: T) => number): Promise<number> {
    const all = await this.getAllRecords();
    return all.reduce((sum, r) => sum + selector(r), 0);
  }

  async maxOfFloat(selector: (record: T) => number): Promise<number> {
    return this.maxOfDouble(selector);
  }
  async minOfFloat(selector: (record: T) => number): Promise<number> {
    return this.minOfDouble(selector);
  }
  async sumOfFloat(selector: (record: T) => number): Promise<number> {
    return this.sumOfDouble(selector);
  }
  async maxOfInt(selector: (record: T) => number): Promise<number> {
    return this.maxOfDouble(selector);
  }
  async minOfInt(selector: (record: T) => number): Promise<number> {
    return this.minOfDouble(selector);
  }
  async sumOfInt(selector: (record: T) => number): Promise<number> {
    return this.sumOfDouble(selector);
  }
  async maxOfLong(selector: (record: T) => number): Promise<number> {
    return this.maxOfDouble(selector);
  }
  async minOfLong(selector: (record: T) => number): Promise<number> {
    return this.minOfDouble(selector);
  }
  async sumOfLong(selector: (record: T) => number): Promise<number> {
    return this.sumOfDouble(selector);
  }

  async sumOfBigInt(selector: (record: T) => bigint): Promise<bigint> {
    const all = await this.getAllRecords();
    return all.reduce((sum, r) => sum + selector(r), 0n);
  }

  async forEachPageParallel(action: (item: T) => void | Promise<void>): Promise<void> {
    await this.forEachPage(records => Promise.all(records.map(action)).then(() => true));
  }
}

export default QueryResults;
