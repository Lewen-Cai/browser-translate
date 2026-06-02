import { parseJson3 } from '~/core/subtitles/parseJson3';
import type { Cue } from '~/core/subtitles/types';
import type { CaptionTrack } from './bridgeProtocol';

export interface TrackPreference {
  activeVssId?: string;
  activeLanguageCode?: string;
}

/**
 * Choose the source caption track to translate. We only ever translate MANUAL
 * (creator-uploaded) tracks — auto-generated (`asr`) tracks are excluded because
 * YouTube renders them in a rolling style that covers our injected translation line
 * (so bilingual can't show). Priority, among manual tracks only:
 *  1. The track the user currently has displayed (matched by vssId, then language).
 *  2. The original spoken language — inferred from the `asr` track's languageCode
 *     (used purely as a hint; the asr track itself is never returned).
 *  3. The first manual track as a last resort.
 * Returns null when there is no manual track (e.g. an ASR-only video) — the caller
 * then hides the button / skips translation.
 */
export function pickTrack(tracks: CaptionTrack[], pref: TrackPreference = {}): CaptionTrack | null {
  const manual = tracks.filter((t) => t.kind !== 'asr');
  if (manual.length === 0) return null;
  const { activeVssId, activeLanguageCode } = pref;

  if (activeVssId) {
    const byVss = manual.find((t) => t.vssId === activeVssId);
    if (byVss) return byVss;
  }
  if (activeLanguageCode) {
    const inLang = manual.find((t) => t.languageCode === activeLanguageCode);
    if (inLang) return inLang;
  }
  const asr = tracks.find((t) => t.kind === 'asr');
  if (asr) {
    const orig = manual.find((t) => t.languageCode === asr.languageCode);
    if (orig) return orig;
  }
  return manual[0]!;
}

/**
 * Get + parse the transcript for a language into cues. The fetch is injected
 * (`fetchText`) because it must go through the MAIN-world bridge, which returns the
 * player's captured (poToken-bearing) json3 body — see `transcriptBridge`. Tests
 * pass a stub.
 */
export async function fetchTranscript(
  languageCode: string,
  fetchText: (lang: string) => Promise<string>,
): Promise<Cue[]> {
  const body = await fetchText(languageCode);
  const cues = parseJson3(body);
  return cues;
}
