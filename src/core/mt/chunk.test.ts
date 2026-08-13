import { describe, it, expect } from 'vitest';
import { chunkTexts } from './chunk';

describe('chunkTexts', () => {
  it('splits on the count limit', () => {
    expect(chunkTexts(['a', 'b', 'c', 'd', 'e'], 2, 1000)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('splits on the character limit', () => {
    expect(chunkTexts(['12345', '67890', '1'], 10, 10)).toEqual([['12345', '67890'], ['1']]);
  });

  it('keeps an over-long text as its own batch rather than dropping it', () => {
    const long = 'x'.repeat(50);
    expect(chunkTexts(['a', long, 'b'], 10, 10)).toEqual([['a'], [long], ['b']]);
  });

  it('returns no batches for no input', () => {
    expect(chunkTexts([], 10, 100)).toEqual([]);
  });

  it('never emits an empty batch even with degenerate limits', () => {
    const batches = chunkTexts(['a', 'b'], 0, 0);
    expect(batches).toEqual([['a'], ['b']]);
  });
});
