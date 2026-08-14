import type { Cue } from './types';

/**
 * Who said it, kept out of what was said.
 *
 * A meeting recorder labels every line with a speaker — `Name: what they said`
 * — and sending that to a translator translates the label too. A model renders
 * a transliterated name differently almost every time, so the same person
 * arrives under a new name every few seconds, which reads as a fault and makes
 * the subtitles harder to follow than no names at all. Free services are no
 * better: a short name is just a word to them.
 *
 * So the label comes off before translation and goes back on afterwards,
 * verbatim. It also means two people saying the same sentence share one cache
 * entry, and one fewer thing for the model to get wrong.
 */

/**
 * A label is only taken as a speaker if the same one turns up on another cue.
 * One "Chapter 3: the basics" in a lecture transcript is a sentence; a name
 * repeats, because a person says more than one thing.
 */
const MIN_OCCURRENCES = 2;

/** A speaker label is a name, not a clause: short, unpunctuated, a few words. */
const MAX_LABEL_CHARS = 40;
const MAX_LABEL_WORDS = 4;

/** `Name:` or `姓名：` at the very start, with the rest of the line after it. */
const PREFIX = /^([^:：]{1,40})[:：][ \t]+(.+)$/;

export interface SpeakerSplit {
  speaker?: string;
  text: string;
}

/**
 * Split one line into a possible speaker and the words. Used on its own where
 * the label is explicit (WebVTT's `<v Name>`); everywhere else go through
 * `attachSpeakers`, which will not act on a label it has seen only once.
 */
export function splitSpeaker(line: string): SpeakerSplit {
  const match = PREFIX.exec(line);
  if (!match) return { text: line };
  const label = match[1]!.trim();
  const rest = match[2]!.trim();
  if (!rest || !looksLikeName(label)) return { text: line };
  return { speaker: label, text: rest };
}

function looksLikeName(label: string): boolean {
  if (!label || label.length > MAX_LABEL_CHARS) return false;
  // Sentence punctuation means this was a clause that happened to end in a
  // colon, not somebody's name.
  if (/[.!?,;、。！？]/.test(label)) return false;
  // A bare number before a colon is a timestamp or a list marker.
  if (/^\d+$/.test(label.replace(/\s/g, ''))) return false;
  if (label.split(/\s+/).length > MAX_LABEL_WORDS) return false;
  // Something has to be a letter, or this is punctuation and digits.
  return /\p{L}/u.test(label);
}

/**
 * Take the speaker labels off a transcript, where it turns out to have them.
 *
 * Whole-transcript rather than line-by-line, because that is the only level at
 * which "this is a name" can be told from "this line happens to contain a
 * colon": a name comes back.
 */
export function attachSpeakers(cues: readonly Cue[]): Cue[] {
  const counts = new Map<string, number>();
  const splits = cues.map((cue) => {
    // A cue that already knows who is speaking was told outright — by WebVTT's
    // `<v Name>` — and needs none of this.
    if (cue.speaker) return { text: cue.text };
    const split = splitSpeaker(cue.text);
    if (split.speaker) counts.set(split.speaker, (counts.get(split.speaker) ?? 0) + 1);
    return split;
  });

  return cues.map((cue, i) => {
    const split = splits[i]!;
    if (!split.speaker || (counts.get(split.speaker) ?? 0) < MIN_OCCURRENCES) return cue;
    return { ...cue, text: split.text, speaker: split.speaker };
  });
}
