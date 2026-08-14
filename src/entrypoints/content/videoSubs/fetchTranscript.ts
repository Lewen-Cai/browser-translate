import { parseJson3 } from '~/core/subtitles/parseJson3';
import type { Cue } from '~/core/subtitles/types';
import type { CaptionTrack } from './bridgeProtocol';

export interface TrackPreference {
  activeVssId?: string;
  activeLanguageCode?: string;
}

/**
 * Choose the source caption track to translate. Manual (creator-uploaded)
 * tracks are preferred because their wording and timing are better, but an
 * auto-generated (`asr`) track is used when that is all the video has — we draw
 * the subtitles ourselves now, so the rolling render that used to make ASR
 * unusable no longer matters. Priority:
 *  1. The track the viewer currently has displayed (matched by vssId, then language).
 *  2. The original spoken language — inferred from the `asr` track's languageCode.
 *  3. The first manual track, else the ASR track.
 * Returns null only when the video has no caption track at all.
 */
export function pickTrack(tracks: CaptionTrack[], pref: TrackPreference = {}): CaptionTrack | null {
  if (tracks.length === 0) return null;
  const manual = tracks.filter((t) => t.kind !== 'asr');
  const { activeVssId, activeLanguageCode } = pref;

  if (activeVssId) {
    const byVss = tracks.find((t) => t.vssId === activeVssId);
    if (byVss) return byVss;
  }
  if (activeLanguageCode) {
    const inLang = manual.find((t) => t.languageCode === activeLanguageCode)
      ?? tracks.find((t) => t.languageCode === activeLanguageCode);
    if (inLang) return inLang;
  }
  const asr = tracks.find((t) => t.kind === 'asr');
  if (asr) {
    const orig = manual.find((t) => t.languageCode === asr.languageCode);
    if (orig) return orig;
  }
  return manual[0] ?? tracks[0]!;
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
