import type { Cue } from '~/core/subtitles/types';

/**
 * Reading captions the browser has already parsed.
 *
 * A `<track>` element is the standard way a page ships subtitles, and by the
 * time we look the browser has fetched and parsed the WebVTT for us. That makes
 * this the cheapest transcript source there is — no network, no parser of our
 * own, and it works on any player that uses the platform rather than painting
 * captions itself.
 */

/** Track kinds that carry what is being said, as opposed to chapters or metadata. */
const SPOKEN_KINDS = ['subtitles', 'captions'];

/**
 * The track to translate. A showing track is the reader's own choice and wins;
 * otherwise the first spoken-word track, whatever its language, since a page
 * that ships one track ships the one it has.
 */
export function pickTextTrack(tracks: TextTrackList | null | undefined): TextTrack | null {
  if (!tracks) return null;
  const all = [...(tracks as unknown as Iterable<TextTrack>)];
  const spoken = all.filter((t) => SPOKEN_KINDS.includes(t.kind));
  return spoken.find((t) => t.mode === 'showing') ?? spoken[0] ?? null;
}

/**
 * Pull every cue out of a track.
 *
 * The cues are only populated once the track has been loaded, which the browser
 * does lazily — a track left `disabled` never loads at all. Switching it to
 * `hidden` starts that load without putting the site's own captions on screen,
 * which matters because we draw our own; the wait below is for the load to
 * land. The mode is restored afterwards so a reader who had captions showing
 * still has them.
 */
export async function cuesFromTextTrack(track: TextTrack, timeoutMs = 4000): Promise<Cue[]> {
  const previousMode = track.mode;
  if (track.mode === 'disabled') track.mode = 'hidden';

  const list = await waitForCues(track, timeoutMs);
  // Leave a track we woke up in `hidden`, not back in `disabled`: the browser
  // would drop the cues again, and this same track is about to be read on every
  // seek. A track the reader had showing is left showing.
  if (previousMode === 'showing') track.mode = 'showing';

  if (!list) return [];
  return [...(list as unknown as Iterable<TextTrackCue>)]
    .map((cue, i) => ({
      id: i,
      startMs: Math.round(cue.startTime * 1000),
      endMs: Math.round(cue.endTime * 1000),
      text: cueText(cue).trim(),
    }))
    .filter((c) => c.text.length > 0);
}

function waitForCues(track: TextTrack, timeoutMs: number): Promise<TextTrackCueList | null> {
  if (track.cues && track.cues.length > 0) return Promise.resolve(track.cues);
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      if (track.cues && track.cues.length > 0) return resolve(track.cues);
      if (Date.now() - started >= timeoutMs) return resolve(track.cues ?? null);
      setTimeout(check, 100);
    };
    check();
  });
}

/**
 * A cue's words. VTTCue carries `text`, which may hold the voice and styling
 * tags WebVTT allows (`<v Speaker>`, `<i>`); those are markup, not speech, so
 * they come out before the line is translated.
 */
function cueText(cue: TextTrackCue): string {
  const raw = (cue as VTTCue).text;
  if (typeof raw !== 'string') return '';
  return raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
}
