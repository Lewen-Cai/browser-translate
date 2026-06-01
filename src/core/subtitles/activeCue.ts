import type { Cue } from './types';

/** Binary-search the cue whose [startMs, endMs) contains timeMs. Assumes cues
 *  are sorted by startMs and non-overlapping. Returns null in gaps. */
export function activeCue(timeMs: number, cues: Cue[]): Cue | null {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = cues[mid]!;
    if (timeMs < c.startMs) hi = mid - 1;
    else if (timeMs >= c.endMs) lo = mid + 1;
    else return c;
  }
  return null;
}
