import { describe, it, expect, vi } from 'vitest';
import { runBatch, type BatchDeps } from './runBatch';

function deps(over: Partial<BatchDeps> = {}): BatchDeps {
  return {
    cacheGet: async () => undefined,
    cacheSet: async () => {},
    translateOnce: async (segs) => segs.map((s) => `T(${s})`),
    translateSingle: async (s) => `S(${s})`,
    ...over,
  };
}

describe('runBatch', () => {
  it('translates all segments when nothing is cached', async () => {
    expect(await runBatch(['a', 'b'], deps())).toEqual(['T(a)', 'T(b)']);
  });
  it('makes no request for an empty input', async () => {
    const translateOnce = vi.fn(async () => []);
    expect(await runBatch([], deps({ translateOnce }))).toEqual([]);
    expect(translateOnce).not.toHaveBeenCalled();
  });
  it('makes no request when every segment is cached', async () => {
    const translateOnce = vi.fn(async () => []);
    expect(await runBatch(['a', 'b'], deps({ cacheGet: async (s) => `HIT(${s})`, translateOnce }))).toEqual(['HIT(a)', 'HIT(b)']);
    expect(translateOnce).not.toHaveBeenCalled();
  });
  it('translates only cache misses and preserves their original positions', async () => {
    const translateOnce = vi.fn(async (segs: string[]) => segs.map((s) => `T(${s})`));
    expect(await runBatch(['a', 'b', 'c'], deps({ cacheGet: async (s) => s === 'b' ? 'CACHED' : undefined, translateOnce }))).toEqual(['T(a)', 'CACHED', 'T(c)']);
    expect(translateOnce).toHaveBeenCalledWith(['a', 'c']);
  });
  it('writes fresh validated translations to cache', async () => {
    const cacheSet = vi.fn(async () => {});
    await runBatch(['a'], deps({ cacheSet }));
    expect(cacheSet).toHaveBeenCalledWith('a', 'T(a)');
  });
  it('uses a separate text-only fallback once per segment after an invalid batch', async () => {
    const translateOnce = vi.fn(async () => null);
    const translateSingle = vi.fn(async (s: string) => `S(${s})`);
    expect(await runBatch(['a', 'b'], deps({ translateOnce, translateSingle }))).toEqual(['S(a)', 'S(b)']);
    expect(translateOnce).toHaveBeenCalledTimes(1);
    expect(translateSingle.mock.calls).toEqual([['a'], ['b']]);
  });
  it('also falls back for a single invalid item instead of returning raw output', async () => {
    const translateSingle = vi.fn(async () => 'Validated plain result');
    expect(await runBatch(['a'], deps({ translateOnce: async () => null, translateSingle }))).toEqual(['Validated plain result']);
    expect(translateSingle).toHaveBeenCalledTimes(1);
  });
  it('does not cache any of the new batch when a fallback fails validation', async () => {
    const cacheSet = vi.fn(async () => {});
    const translateSingle = vi.fn(async (s: string) => { if (s === 'b') throw new Error('invalid format'); return 'valid'; });
    await expect(runBatch(['a', 'b'], deps({ translateOnce: async () => null, translateSingle, cacheSet }))).rejects.toThrow('invalid format');
    expect(cacheSet).not.toHaveBeenCalled();
  });
});
