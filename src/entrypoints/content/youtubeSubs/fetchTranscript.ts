import { parseJson3 } from '~/core/subtitles/parseJson3';
import type { Cue } from '~/core/subtitles/types';
import type { CaptionTrack } from './bridgeProtocol';

export interface TrackPreference {
  activeVssId?: string;
  activeLanguageCode?: string;
}

/**
 * Choose the source caption track to translate. Priority:
 *  1. The track the user currently has displayed (matched by vssId, then language).
 *  2. The original spoken language — inferred from the `asr` (auto) track's language,
 *     preferring a manual track in that language over the asr one.
 *  3. The first track as a last resort.
 * This avoids blindly grabbing tracks[0] (which on multi-language videos can be an
 * unrelated / auto-translated language that returns no cues).
 */
export function pickTrack(tracks: CaptionTrack[], pref: TrackPreference = {}): CaptionTrack | null {
  if (tracks.length === 0) return null;
  const { activeVssId, activeLanguageCode } = pref;

  if (activeVssId) {
    const byVss = tracks.find((t) => t.vssId === activeVssId);
    if (byVss) return byVss;
  }
  if (activeLanguageCode) {
    const inLang = tracks.filter((t) => t.languageCode === activeLanguageCode);
    const manual = inLang.find((t) => t.kind !== 'asr');
    if (manual) return manual;
    if (inLang[0]) return inLang[0];
  }
  const asr = tracks.find((t) => t.kind === 'asr');
  if (asr) {
    const manualOrig = tracks.find((t) => t.kind !== 'asr' && t.languageCode === asr.languageCode);
    return manualOrig ?? asr;
  }
  return tracks[0]!;
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
