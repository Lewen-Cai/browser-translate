import { describe, it, expect } from 'vitest';
import { parseJson3 } from './parseJson3';

describe('parseJson3 (manual captions)', () => {
  it('parses events into trimmed, time-stamped cues', () => {
    const raw = JSON.stringify({
      events: [
        { tStartMs: 1200, dDurationMs: 2000, segs: [{ utf8: 'Hello ' }, { utf8: 'world' }] },
        { tStartMs: 3200, dDurationMs: 1500, segs: [{ utf8: 'Second line' }] },
      ],
    });
    expect(parseJson3(raw)).toEqual([
      { id: 0, startMs: 1200, endMs: 3200, text: 'Hello world' },
      { id: 1, startMs: 3200, endMs: 4700, text: 'Second line' },
    ]);
  });

  it('skips empty / newline-only events', () => {
    const raw = JSON.stringify({
      events: [
        { tStartMs: 0, dDurationMs: 100, segs: [{ utf8: '\n' }] },
        { tStartMs: 100, dDurationMs: 100, segs: [{ utf8: '   ' }] },
        { tStartMs: 200, dDurationMs: 500, segs: [{ utf8: 'Real text' }] },
      ],
    });
    expect(parseJson3(raw)).toEqual([
      { id: 0, startMs: 200, endMs: 700, text: 'Real text' },
    ]);
  });

  it('returns [] for malformed input', () => {
    expect(parseJson3('not json')).toEqual([]);
    expect(parseJson3(JSON.stringify({}))).toEqual([]);
    expect(parseJson3(JSON.stringify({ events: 'nope' }))).toEqual([]);
  });

  it('tolerates events missing segs or timing', () => {
    const raw = JSON.stringify({
      events: [
        { tStartMs: 100, dDurationMs: 200 },
        { segs: [{ utf8: 'No timing' }] },
        { tStartMs: 500, dDurationMs: 300, segs: [{ utf8: 'Ok' }] },
      ],
    });
    expect(parseJson3(raw)).toEqual([
      { id: 0, startMs: 500, endMs: 800, text: 'Ok' },
    ]);
  });
});

describe('parseJson3 (ASR rolling fragments)', () => {
  it('collapses prefix-buildup events to the final line', () => {
    const raw = JSON.stringify({
      events: [
        { tStartMs: 0, dDurationMs: 500, segs: [{ utf8: 'I' }] },
        { tStartMs: 0, dDurationMs: 800, segs: [{ utf8: 'I am' }] },
        { tStartMs: 0, dDurationMs: 1200, segs: [{ utf8: 'I am here' }] },
        { tStartMs: 1200, dDurationMs: 600, segs: [{ utf8: 'Next sentence' }] },
      ],
    });
    expect(parseJson3(raw).map((c) => c.text)).toEqual(['I am here', 'Next sentence']);
  });
});
