import { describe, it, expect } from 'vitest';
import { activeCue } from './activeCue';
import type { Cue } from './types';

const cues: Cue[] = [
  { id: 0, startMs: 1000, endMs: 2000, text: 'a' },
  { id: 1, startMs: 2000, endMs: 3000, text: 'b' },
  { id: 2, startMs: 5000, endMs: 6000, text: 'c' }, // gap 3000-5000
];

describe('activeCue', () => {
  it('returns the cue covering the time', () => {
    expect(activeCue(1500, cues)?.text).toBe('a');
    expect(activeCue(2500, cues)?.text).toBe('b');
    expect(activeCue(5500, cues)?.text).toBe('c');
  });
  it('is inclusive of start, exclusive of end', () => {
    expect(activeCue(2000, cues)?.text).toBe('b');
    expect(activeCue(3000, cues)).toBeNull(); // end of b, before c
  });
  it('returns null before first and inside gaps', () => {
    expect(activeCue(0, cues)).toBeNull();
    expect(activeCue(4000, cues)).toBeNull();
  });
  it('returns null for empty cues', () => {
    expect(activeCue(1000, [])).toBeNull();
  });
});
