import type { Cue } from './types';

interface Json3Seg { utf8?: string }
interface Json3Event { tStartMs?: number; dDurationMs?: number; segs?: Json3Seg[] }

export function parseJson3(raw: string): Cue[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const events = (parsed as { events?: unknown }).events;
  if (!Array.isArray(events)) return [];

  const cues: Cue[] = [];
  for (const ev of events as Json3Event[]) {
    if (typeof ev?.tStartMs !== 'number') continue;
    if (!Array.isArray(ev.segs)) continue;
    const text = ev.segs.map((s) => s?.utf8 ?? '').join('').trim();
    if (!text) continue;
    const startMs = ev.tStartMs;
    const endMs = startMs + (typeof ev.dDurationMs === 'number' ? ev.dDurationMs : 0);
    cues.push({ id: cues.length, startMs, endMs, text });
  }
  return coalesceRolling(cues);
}

/** Drop rolling-buildup cues: when a cue's text is a prefix of the next cue's
 *  text, the earlier one is a partial build-up and is discarded. Re-sequences ids. */
function coalesceRolling(cues: Cue[]): Cue[] {
  const out: Cue[] = [];
  for (let i = 0; i < cues.length; i++) {
    const cur = cues[i]!;
    const next = cues[i + 1];
    if (next && next.text.startsWith(cur.text) && next.text !== cur.text) {
      continue; // partial build-up of the next line
    }
    out.push({ ...cur, id: out.length });
  }
  return out;
}
