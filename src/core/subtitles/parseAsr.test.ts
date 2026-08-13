import { describe, it, expect } from 'vitest';
import { isScrollingAsr, parseScrollingAsr } from './parseAsr';
import { parseJson3 } from './parseJson3';

/** One appending event carrying `words` at `tStartMs`, spaced 300ms apart. */
function ev(tStartMs: number, words: string[]) {
  return {
    tStartMs,
    dDurationMs: 3000,
    segs: words.map((utf8, i) => ({ utf8, tOffsetMs: i * 300 })),
  };
}

const separator = (tStartMs: number) => ({ tStartMs, dDurationMs: 10, aAppend: 1, segs: [{ utf8: '\n' }] });

describe('isScrollingAsr', () => {
  it('recognises the appending form by its separator events', () => {
    expect(isScrollingAsr([ev(0, ['hi']), separator(500)])).toBe(true);
  });
  it('does not claim a manual track', () => {
    expect(isScrollingAsr([{ tStartMs: 0, dDurationMs: 900, segs: [{ utf8: 'Hello there.' }] }])).toBe(false);
    expect(isScrollingAsr('nonsense')).toBe(false);
  });
});

describe('parseScrollingAsr', () => {
  it('joins word-level events into whole sentences', () => {
    const cues = parseScrollingAsr([
      ev(0, ['Hello', 'there', 'this']),
      separator(900),
      ev(1000, ['is', 'a', 'test.']),
      separator(1900),
      ev(2000, ['And', 'here', 'is', 'another.']),
    ]);

    expect(cues.map((c) => c.text)).toEqual([
      'Hello there this is a test.',
      'And here is another.',
    ]);
  });

  it('keeps each cue timed from its first word', () => {
    const cues = parseScrollingAsr([
      ev(0, ['One.']),
      separator(400),
      ev(5000, ['Two.']),
    ]);
    expect(cues[0]!.startMs).toBe(0);
    expect(cues[1]!.startMs).toBe(5000);
  });

  it('ends a cue where the next one starts, so lines never overlap', () => {
    const cues = parseScrollingAsr([
      ev(0, ['One.']),
      separator(400),
      ev(5000, ['Two.']),
    ]);
    expect(cues[0]!.endMs).toBeLessThanOrEqual(cues[1]!.startMs);
  });

  it('breaks on a long pause even without punctuation', () => {
    const cues = parseScrollingAsr([
      ev(0, ['some', 'words', 'here']),
      ev(9000, ['much', 'later']),
    ]);
    expect(cues).toHaveLength(2);
    expect(cues[1]!.text).toBe('much later');
  });

  it('breaks a run-on line that never punctuates', () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`);
    const cues = parseScrollingAsr([ev(0, words)]);
    expect(cues.length).toBeGreaterThan(1);
    for (const cue of cues) expect(cue.text.length).toBeLessThan(120);
  });

  it('joins CJK words without inserting spaces', () => {
    const cues = parseScrollingAsr([ev(0, ['今天', '天气', '很好。'])]);
    expect(cues[0]!.text).toBe('今天天气很好。');
  });

  it('drops sound annotations rather than spending a request on them', () => {
    const cues = parseScrollingAsr([
      ev(0, ['[Music]']),
      separator(500),
      ev(1000, ['Real', 'words.']),
    ]);
    expect(cues.map((c) => c.text)).toEqual(['Real words.']);
  });

  it('numbers cues from zero without gaps', () => {
    const cues = parseScrollingAsr([
      ev(0, ['[Music]']),
      separator(400),
      ev(1000, ['One.']),
      separator(1400),
      ev(2000, ['Two.']),
    ]);
    expect(cues.map((c) => c.id)).toEqual([0, 1]);
  });

  it('returns nothing for a track with no words', () => {
    expect(parseScrollingAsr([separator(0)])).toEqual([]);
  });
});

describe('parseJson3 routing', () => {
  it('sends an appending track through the ASR path', () => {
    const raw = JSON.stringify({ events: [ev(0, ['Hello', 'there.']), separator(900)] });
    expect(parseJson3(raw).map((c) => c.text)).toEqual(['Hello there.']);
  });

  it('leaves a manual track on the original path', () => {
    const raw = JSON.stringify({
      events: [
        { tStartMs: 0, dDurationMs: 900, segs: [{ utf8: 'Hello there.' }] },
        { tStartMs: 1000, dDurationMs: 900, segs: [{ utf8: 'Second line.' }] },
      ],
    });
    expect(parseJson3(raw).map((c) => c.text)).toEqual(['Hello there.', 'Second line.']);
  });
});
