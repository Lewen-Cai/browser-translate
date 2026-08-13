import type { Cue } from './types';

/**
 * Auto-generated (ASR) tracks are delivered word by word: each event appends a
 * few words to a rolling window, with separator events (`aAppend: 1`) marking
 * where the player starts a new line. Parsed naively that yields cues a couple
 * of words long, which are useless to translate — there is no sentence for the
 * translator to work with, and the result reads like word salad.
 *
 * So the words are collected with their own timings and regrouped into
 * sentence-sized cues: split on terminal punctuation, on a noticeable pause, or
 * when a line has simply grown too long to sit on screen.
 */

const PAUSE_MS = 1200;
const MAX_CHARS_LATIN = 90;
const MAX_CHARS_CJK = 30;
const SENTENCE_END = /[.!?。！？…]['")\]]?$/;

/** Sound annotations carry no meaning to translate and only cost requests. */
const NOISE = /^[[(（【]?\s*(music|applause|laughter|音乐|掌声|笑声|拍手)\s*[\])）】]?$/i;
const NOISE_MARKS = /^[\s♪🎵♫～~]+$/u;

interface AsrSeg { utf8?: string; tOffsetMs?: number }
interface AsrEvent { tStartMs?: number; dDurationMs?: number; aAppend?: number; segs?: AsrSeg[] }

interface Word { text: string; startMs: number }

/** True when the track uses the appending, word-at-a-time form. */
export function isScrollingAsr(events: unknown): boolean {
  return Array.isArray(events) && events.some((e) => (e as AsrEvent)?.aAppend === 1);
}

export function parseScrollingAsr(events: unknown[]): Cue[] {
  const words = collectWords(events as AsrEvent[]);
  if (words.length === 0) return [];
  const cjk = isMostlyCjk(words.map((w) => w.text).join(''));
  return groupIntoSentences(words, cjk);
}

function collectWords(events: AsrEvent[]): Word[] {
  const words: Word[] = [];
  for (const ev of events) {
    // Separator events only tell the player to break the line; their payload is
    // a newline, so there is nothing to collect from them.
    if (ev?.aAppend === 1) continue;
    if (typeof ev?.tStartMs !== 'number' || !Array.isArray(ev.segs)) continue;
    for (const seg of ev.segs) {
      const text = seg?.utf8 ?? '';
      if (!text.trim()) continue;
      // Sound annotations arrive as their own word and must be dropped here:
      // left in place they would be swallowed into the next sentence, which
      // is both wrong to translate and impossible to filter afterwards.
      if (isNoise(text)) continue;
      words.push({ text, startMs: ev.tStartMs + (seg.tOffsetMs ?? 0) });
    }
  }
  return words;
}

function groupIntoSentences(words: Word[], cjk: boolean): Cue[] {
  const maxChars = cjk ? MAX_CHARS_CJK : MAX_CHARS_LATIN;
  const cues: Cue[] = [];
  let buffer: Word[] = [];

  const flush = (endMs: number): void => {
    if (buffer.length === 0) return;
    const text = joinWords(buffer, cjk);
    const startMs = buffer[0]!.startMs;
    buffer = [];
    if (!text || isNoise(text)) return;
    cues.push({ id: cues.length, startMs, endMs: Math.max(endMs, startMs + 500), text });
  };

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;
    buffer.push(word);
    const next = words[i + 1];
    const text = joinWords(buffer, cjk);

    const atSentenceEnd = SENTENCE_END.test(text.trimEnd());
    const tooLong = text.length >= maxChars;
    const beforePause = next !== undefined && next.startMs - word.startMs >= PAUSE_MS;

    if (atSentenceEnd || tooLong || beforePause || next === undefined) {
      // A cue runs until the next word starts, so lines don't overlap the way
      // the rolling window does on screen.
      flush(next?.startMs ?? word.startMs + 2000);
    }
  }

  return cues;
}

/** ASR segments carry their own spacing for space-separated languages; CJK has none. */
function joinWords(words: Word[], cjk: boolean): string {
  const raw = words.map((w) => w.text).join(cjk ? '' : ' ');
  return raw.replace(/\s+/g, cjk ? '' : ' ').trim();
}

function isNoise(text: string): boolean {
  return NOISE.test(text.trim()) || NOISE_MARKS.test(text);
}

function isMostlyCjk(text: string): boolean {
  const cjk = text.match(/[぀-ヿ㐀-䶿一-鿿가-힯]/g)?.length ?? 0;
  const letters = text.match(/[A-Za-z]/g)?.length ?? 0;
  return cjk > letters;
}
