import { describe, it, expect, vi } from 'vitest';
import { mtTranslateAll } from './run';
import type { MtEngine } from './types';

function fakeEngine(over: Partial<MtEngine> = {}): MtEngine {
  return {
    id: 'microsoft',
    label: 'Fake',
    maxBatchSize: 2,
    maxBatchChars: 1000,
    translate: async ({ texts }) => texts.map((t) => `[${t}]`),
    ...over,
  };
}

describe('mtTranslateAll', () => {
  it('batches by the engine limits and returns one translation per input, in order', async () => {
    const translate = vi.fn(async ({ texts }: { texts: string[] }) => texts.map((t) => `[${t}]`));
    const engine = fakeEngine({ translate });

    const out = await mtTranslateAll(engine, { texts: ['a', 'b', 'c'], targetLang: 'zh-CN' });

    expect(out).toEqual(['[a]', '[b]', '[c]']);
    expect(translate).toHaveBeenCalledTimes(2);
  });

  it('preserves input order even when later batches finish first', async () => {
    const engine = fakeEngine({
      maxBatchSize: 1,
      translate: async ({ texts }) => {
        const text = texts[0]!;
        // The first batch resolves last.
        if (text === 'a') await new Promise((r) => setTimeout(r, 20));
        return [text.toUpperCase()];
      },
    });

    expect(await mtTranslateAll(engine, { texts: ['a', 'b', 'c'], targetLang: 'en' }, 3))
      .toEqual(['A', 'B', 'C']);
  });

  it('passes the request fields through to every batch', async () => {
    const translate = vi.fn(async ({ texts }: { texts: string[] }) => texts);
    const signal = new AbortController().signal;

    await mtTranslateAll(fakeEngine({ translate }), {
      texts: ['a', 'b', 'c'], targetLang: 'ja', sourceLang: 'en', signal,
    });

    for (const call of translate.mock.calls) {
      expect(call[0]).toMatchObject({ targetLang: 'ja', sourceLang: 'en', signal });
    }
  });

  it('does nothing for an empty list', async () => {
    const translate = vi.fn();
    expect(await mtTranslateAll(fakeEngine({ translate }), { texts: [], targetLang: 'en' })).toEqual([]);
    expect(translate).not.toHaveBeenCalled();
  });

  it('propagates a batch failure', async () => {
    const engine = fakeEngine({ translate: async () => { throw new Error('boom'); } });
    await expect(mtTranslateAll(engine, { texts: ['a'], targetLang: 'en' })).rejects.toThrow('boom');
  });
});
