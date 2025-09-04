import { describe, it, expect, vi } from 'vitest';
import { QueryBuilder } from '../src/builders/query-builder';

function makeExec() {
  return {
    count: vi.fn(),
    queryPage: vi.fn().mockImplementation((_table, _select, opts) => {
      if (!opts.nextPage) return Promise.resolve({ records: [{ id: 1 }, { id: 2 }], nextPage: 'n1' });
      if (opts.nextPage === 'n1') return Promise.resolve({ records: [{ id: 3 }], nextPage: null });
      return Promise.resolve({ records: [], nextPage: null });
    }),
    update: vi.fn(),
    deleteByQuery: vi.fn(),
    stream: vi.fn(),
  };
}

describe('QueryResults', () => {
  it('iterates records across pages and exposes helpers', async () => {
    const exec = makeExec();
    const qb = new QueryBuilder(exec as any, 'users');
    const res = await qb.list();

    expect(res.first()).toEqual({ id: 1 });
    expect(res.firstOrNull()).toEqual({ id: 1 });
    expect(res.isEmpty()).toBe(false);
    expect(res.size()).toBe(2);

    let onPage = 0;
    res.forEachOnPage(() => {
      onPage++;
    });
    expect(onPage).toBe(2);

    const ids: number[] = [];
    await res.forEachPage(page => {
      ids.push(...page.map(r => r.id));
      return true;
    });
    expect(ids).toEqual([1, 2, 3]);
    expect(exec.queryPage).toHaveBeenCalledTimes(2);
    // cover branch where action returns false
    await res.forEachPage(() => false);

    const all = await res.getAllRecords();
    expect(all.map(r => r.id)).toEqual([1, 2, 3]);

    const filtered = await res.filterAll(r => r.id > 1);
    expect(filtered.map(r => r.id)).toEqual([2, 3]);

    const mapped = await res.mapAll(r => r.id);
    expect(mapped).toEqual([1, 2, 3]);

    expect(await res.maxOfInt(r => r.id)).toBe(3);
    expect(await res.sumOfInt(r => r.id)).toBe(6);
    expect(await res.minOfInt(r => r.id)).toBe(1);
    expect(await res.maxOfDouble(r => r.id)).toBe(3);
    expect(await res.minOfDouble(r => r.id)).toBe(1);
    expect(await res.sumOfDouble(r => r.id)).toBe(6);
    expect(await res.maxOfFloat(r => r.id)).toBe(3);
    expect(await res.minOfFloat(r => r.id)).toBe(1);
    expect(await res.sumOfFloat(r => r.id)).toBe(6);
    expect(await res.maxOfLong(r => r.id)).toBe(3);
    expect(await res.minOfLong(r => r.id)).toBe(1);
    expect(await res.sumOfLong(r => r.id)).toBe(6);
    expect(await res.sumOfBigInt(r => BigInt(r.id))).toBe(6n);

    const seen: number[] = [];
    await res.forEachAll(r => {
      seen.push(r.id);
    });
    expect(seen).toEqual([1, 2, 3]);

    const limited: number[] = [];
    await res.forEachAll(r => {
      limited.push(r.id);
      return r.id < 2;
    });
    expect(limited).toEqual([1, 2]);

    let parallel = 0;
    await res.forEachPageParallel(async r => {
      parallel += r.id;
    });
    expect(parallel).toBe(6);

    const empty = new (res.constructor as any)([], null);
    expect(empty.firstOrNull()).toBeNull();
    expect(() => empty.first()).toThrow();
  });
});
