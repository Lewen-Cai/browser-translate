import { describe, it, expect, vi } from 'vitest';
import { createCueTranslator } from './translateCues';
import type { Cue } from '~/core/subtitles/types';

const cues: Cue[] = [0, 1, 2].map((i) => ({
  id: i, startMs: i * 1000, endMs: i * 1000 + 900, text: `line${i}`,
}));

describe('createCueTranslator', () => {
  it('translates all cues and fills the map', async () => {
    const fakeBatch = vi.fn(async (req: { segments: string[] }) =>
      req.segments.map((s) => `译:${s}`),
    );
    const onUpdate = vi.fn();
    const tr = createCueTranslator({
      translateBatchFn: fakeBatch,
      abortFn: vi.fn(),
      getTargetLang: () => 'zh-CN',
      getCurrentTimeMs: () => 0,
      onUpdate,
      concurrency: 2,
    });
    await tr.run(cues);
    expect(tr.get(0)).toBe('译:line0');
    expect(tr.get(2)).toBe('译:line2');
    expect(onUpdate).toHaveBeenCalled();
  });

  it('drops results and aborts after teardown (epoch guard)', async () => {
    let resolveBatch: (v: string[]) => void = () => {};
    const fakeBatch = vi.fn(
      () => new Promise<string[]>((r) => { resolveBatch = r; }),
    );
    const abortFn = vi.fn();
    const tr = createCueTranslator({
      translateBatchFn: fakeBatch,
      abortFn,
      getTargetLang: () => 'zh-CN',
      getCurrentTimeMs: () => 0,
      onUpdate: vi.fn(),
      concurrency: 2,
    });
    const p = tr.run(cues);
    tr.teardown();              // bump epoch + abort in-flight
    resolveBatch(['译:line0', '译:line1', '译:line2']);
    await p;
    expect(abortFn).toHaveBeenCalled();
    expect(tr.get(0)).toBeUndefined(); // stale result dropped
  });
});
