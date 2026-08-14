import { attachSpeakers } from './speaker';
import type { Cue } from './types';

/**
 * WebVTT, as served by a site that hands out its transcript as a file.
 *
 * Where a page attaches its captions with a `<track>` the browser parses them
 * for us and this is not needed — see the generic site adapter. This is for the
 * ones that keep the transcript behind their own endpoint, which is common on
 * meeting recorders, and there the file is all there is.
 *
 * Deliberately partial. Positioning, regions and styling decide where a cue is
 * drawn, and we draw the lines ourselves; what matters is when each cue starts,
 * when it ends, and what was said.
 */

/** `00:01:02.500` or `01:02.500` — WebVTT makes the hour optional. */
const TIMING = /((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})/;

export function parseVtt(raw: string): Cue[] {
  if (!raw) return [];
  const cues: Cue[] = [];

  // A blank line ends a cue, which makes blocks the unit to read. Splitting on
  // them rather than walking line by line is also what makes the optional cue
  // identifier free: it is simply a line in the block that is not the timing.
  //
  // Line endings are normalised first — a file written on Windows, or served
  // through something that rewrote them, has to parse the same.
  for (const block of raw.replace(/\r\n?/g, '\n').split(/\n[ \t]*\n/)) {
    const lines = block.split('\n');
    const at = lines.findIndex((l) => TIMING.test(l));
    if (at === -1) continue; // WEBVTT header, NOTE, STYLE, REGION — no cue here

    const timing = TIMING.exec(lines[at]!)!;
    const body = lines.slice(at + 1);
    const text = body
      .map(stripTags)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;

    // `<v Ana>` names the speaker outright, so it needs none of the guesswork
    // the plain "Name:" form does — take it wherever it appears.
    const tagged = voiceTag(body);
    const split = tagged ? { speaker: tagged, text } : { text };

    cues.push({
      id: cues.length,
      startMs: toMs(timing[1]!),
      endMs: toMs(timing[2]!),
      ...split,
    });
  }

  // The plain form is only a speaker if the same label comes back.
  return attachSpeakers(cues);
}

/** The name in a `<v Name>` voice span, if the cue opens with one. */
function voiceTag(body: readonly string[]): string | undefined {
  const match = /<v(?:\.\S+)*\s+([^>]+)>/.exec(body[0] ?? '');
  return match ? match[1]!.trim() : undefined;
}

/**
 * A cue's words without the markup WebVTT allows around them — `<v Speaker>`,
 * `<i>`, the timestamp tags used for karaoke-style reveal. That is how a cue is
 * drawn, not what was said, and a model asked to translate it would carry the
 * tags into its answer.
 */
function stripTags(line: string): string {
  return line.replace(/<[^>]*>/g, '');
}

function toMs(stamp: string): number {
  const parts = stamp.replace(',', '.').split(':');
  const seconds = Number(parts.pop() ?? 0);
  const minutes = Number(parts.pop() ?? 0);
  const hours = Number(parts.pop() ?? 0);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}
