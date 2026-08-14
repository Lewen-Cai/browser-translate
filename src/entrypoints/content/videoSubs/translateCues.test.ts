import { describe, it, expect, vi } from 'vitest';
import { createCueTranslator, type CueTranslatorDeps } from './translateCues';
import type { Cue } from '~/core/subtitles/types';

/** Cues one second apart, `line0`, `line1`, … */
function makeCues(count: number): Cue[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i, startMs: i * 1000, endMs: i * 1000 + 900, text: `line${i}`,
  }));
}

function setup(over: Partial<CueTranslatorDeps> = {}) {
  let nowMs = 0;
  const translateBatchFn = vi.fn(async (req: { segments: string[] }) =>
    req.segments.map((s) => `译:${s}`),
  );
  const onUpdate = vi.fn();
  const abortFn = vi.fn();
  const translator = createCueTranslator({
    translateBatchFn,
    abortFn,
    getTargetLang: () => 'zh-CN',
    getCurrentTimeMs: () => nowMs,
    getPlaybackRate: () => 1,
    onUpdate,
    concurrency: 2,
    ...over,
  });
  return {
    translator, translateBatchFn, onUpdate, abortFn,
    seek: (ms: number) => { nowMs = ms; },
  };
}

/** Let every queued microtask settle. */
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('createCueTranslator', () => {
  it('translates the cues around the playhead when pumped', async () => {
    const { translator, onUpdate } = setup();
    translator.start(makeCues(3));
    translator.pump();
    await settle();

    expect(translator.get(0)).toBe('译:line0');
    expect(translator.get(2)).toBe('译:line2');
    expect(onUpdate).toHaveBeenCalled();
  });

  it('translates nothing until pumped', async () => {
    const { translator, translateBatchFn } = setup();
    translator.start(makeCues(3));
    await settle();
    expect(translateBatchFn).not.toHaveBeenCalled();
  });

  it('leaves cues beyond the look-ahead window alone', async () => {
    const { translator } = setup();
    // 120 cues span two minutes; the window reaches 30s ahead.
    translator.start(makeCues(120));
    translator.pump();
    await settle();

    expect(translator.get(5)).toBe('译:line5');
    expect(translator.get(100)).toBeUndefined();
  });

  it('picks up the new position after a seek instead of grinding through the old queue', async () => {
    const { translator, seek } = setup();
    translator.start(makeCues(120));
    translator.pump();
    await settle();
    expect(translator.get(90)).toBeUndefined();

    seek(90_000);
    translator.pump();
    await settle();
    expect(translator.get(90)).toBe('译:line90');
  });

  it('widens the window when the video plays faster', async () => {
    const atRate = async (rate: number) => {
      const { translator } = setup({ getPlaybackRate: () => rate });
      translator.start(makeCues(200));
      translator.pump();
      await settle();
      return makeCues(200).filter((c) => translator.get(c.id) !== undefined).length;
    };
    expect(await atRate(2)).toBeGreaterThan(await atRate(1));
  });

  it('translates the cue on screen before the ones buffering ahead', async () => {
    const order: string[][] = [];
    const { translator, seek } = setup({
      translateBatchFn: async (req) => {
        order.push(req.segments);
        return req.segments.map((s) => `译:${s}`);
      },
      concurrency: 1,
    });
    seek(4_000); // line4 is on screen
    translator.start(makeCues(60));
    translator.pump();
    await settle();

    expect(order[0]).toContain('line4');
  });

  it('does not exceed the configured concurrency', async () => {
    let inFlight = 0;
    let peak = 0;
    const { translator } = setup({
      concurrency: 2,
      translateBatchFn: async (req) => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 1));
        inFlight--;
        return req.segments.map((s) => `译:${s}`);
      },
    });
    translator.start(makeCues(60));
    translator.pump();
    translator.pump(); // extra pumps must not stack up more workers
    await settle();

    expect(peak).toBeLessThanOrEqual(2);
  });

  it('drops results and aborts in-flight requests after teardown (epoch guard)', async () => {
    let resolveBatch: (v: string[]) => void = () => {};
    const { translator, abortFn } = setup({
      translateBatchFn: () => new Promise<string[]>((r) => { resolveBatch = r; }),
    });
    translator.start(makeCues(3));
    translator.pump();
    translator.teardown();
    resolveBatch(['译:line0', '译:line1', '译:line2']);
    await settle();

    expect(abortFn).toHaveBeenCalled();
    expect(translator.get(0)).toBeUndefined();
  });

  it('retries a failed batch once, then gives up instead of spinning', async () => {
    const translateBatchFn = vi.fn(async () => { throw new Error('nope'); });
    const { translator } = setup({ translateBatchFn, concurrency: 1 });
    translator.start(makeCues(3));

    // Each pump makes one attempt; the second exhausts the cues' attempts.
    translator.pump();
    await settle();
    translator.pump();
    await settle();
    const callsAfterGivingUp = translateBatchFn.mock.calls.length;
    expect(callsAfterGivingUp).toBe(2);

    // Further pumps must not pick the cues back up.
    translator.pump();
    await settle();
    expect(translateBatchFn.mock.calls.length).toBe(callsAfterGivingUp);
  });

  it('marks a cue failed once its attempts are spent, so the UI can stop waiting', async () => {
    const { translator } = setup({
      translateBatchFn: async () => { throw new Error('nope'); },
      concurrency: 1,
    });
    translator.start(makeCues(3));
    expect(translator.isFailed(0)).toBe(false);

    translator.pump();
    await settle();
    expect(translator.isFailed(0)).toBe(false); // still has a retry left

    translator.pump();
    await settle();
    expect(translator.isFailed(0)).toBe(true);
    expect(translator.get(0)).toBeUndefined();
  });

  it('succeeds on the retry when the failure was transient', async () => {
    let calls = 0;
    const { translator } = setup({
      concurrency: 1,
      translateBatchFn: async (req) => {
        if (++calls === 1) throw new Error('rate limited');
        return req.segments.map((s) => `译:${s}`);
      },
    });
    translator.start(makeCues(3));
    translator.pump();
    await settle();
    translator.pump();
    await settle();

    expect(translator.get(0)).toBe('译:line0');
    expect(translator.isFailed(0)).toBe(false);
  });
});
