import { cuesFromTextTrack, pickTextTrack } from '../textTracks';
import { parseVtt } from '~/core/subtitles/parseVtt';
import type { SiteMatcher, SiteProbe, SubtitleSite } from '../site';
import type { Cue } from '~/core/subtitles/types';

/**
 * Canvas (Instructure) media attachments.
 *
 * Canvas serves each video from its own same-origin iframe at
 * `/media_attachments_iframe/<id>`, which is why subtitle translation runs in
 * every frame — from the course page there is no video to find at all. One page
 * can embed several, and each frame gets its own translator, which is exactly
 * what two recordings on one page need.
 *
 * The captions themselves need nothing special: Canvas declares a real
 * `<track>`, so the browser has already fetched and parsed it. Only the player
 * furniture is Canvas-shaped, and its class names are CSS-module hashes that
 * change with every Canvas build — so they are matched on the readable part
 * rather than in full.
 */
export function createCanvasSite(): SubtitleSite {
  return {
    id: 'canvas',
    selectors: {
      player: '[data-bt-player]',
      // In fullscreen the controls are drawn over the picture rather than under
      // it, so the subtitles and the settings panel have to be told where they
      // are or they sit underneath them.
      controls: '[class*="controls-overlay"], [class*="control-bar"]',
      // Canvas draws its own captions over the video; ours would sit on top.
      nativeCaptions: '[class*="caption-display"], [class*="captions-display"]',
    },
    button: {
      container: '[class*="right-controls"]',
      before: '[class*="full-screen-button"]',
      // Canvas's own class carries the size and the colour, and its controls
      // are drawn dark — so nothing here overrides either.
      className: 'controls-button',
      fallback: 'player-corner',
    },

    findVideo: () => {
      const video = document.querySelector<HTMLVideoElement>('video');
      if (video) markPlayer(video);
      return video;
    },

    // One frame, one attachment — the id is in the address and does not change
    // without a navigation.
    mediaKey: () => location.pathname,

    // Canvas renders the video about a second before it renders the track
    // inside it, and a probe in that gap answers "no captions" for a recording
    // that has them.
    readyToProbe: () => hasCaptionMarkup(document.querySelector('video')),

    async probe(): Promise<SiteProbe> {
      const video = document.querySelector<HTMLVideoElement>('video');
      if (!video) return { kind: 'none' };
      markPlayer(video);
      const track = pickTextTrack(video.textTracks);
      if (track) return { kind: 'ready', languageCode: track.language || undefined };
      // A listed caption file, or a declared track whose cues have yet to load:
      // either way there is something to translate, and saying so keeps the
      // toggle on offer.
      const listed = document.querySelector('[data-captions]')?.getAttribute('data-captions');
      if (listed && listed !== '[]') return { kind: 'unknown' };
      return video.querySelector('track') ? { kind: 'unknown' } : { kind: 'none' };
    },

    async fetchTranscript(): Promise<Cue[]> {
      // Canvas's `<track>` is declared but empty: it carries no `src`, and the
      // player fills it in only once the reader turns captions on — and puts it
      // straight back to `disabled` when they are off, undoing our own attempt
      // to wake it. So the file is fetched from the address Canvas publishes
      // beside the player, which needs nobody to switch anything on first.
      const listed = await fetchListedTrack();
      if (listed.length > 0) return listed;

      const video = document.querySelector<HTMLVideoElement>('video');
      const track = pickTextTrack(video?.textTracks);
      if (!track) throw new Error('no caption track');
      return cuesFromTextTrack(track);
    },
  };
}

interface CanvasTrack {
  kind?: string;
  locale?: string;
  url?: string;
  src?: string;
  asr?: boolean;
}

/**
 * The caption file Canvas names in `data-captions` beside the player: a JSON
 * list of the tracks it holds, each with its own same-origin address. Author-
 * written tracks come before machine-written ones, which is the same preference
 * every other adapter makes.
 */
async function fetchListedTrack(): Promise<Cue[]> {
  const raw = document.querySelector('[data-captions]')?.getAttribute('data-captions');
  if (!raw) return [];

  let listed: CanvasTrack[];
  try {
    const parsed: unknown = JSON.parse(raw);
    listed = Array.isArray(parsed) ? (parsed as CanvasTrack[]) : [];
  } catch {
    return [];
  }

  const spoken = listed.filter((t) => t.kind === 'subtitles' || t.kind === 'captions');
  const chosen = spoken.find((t) => !t.asr) ?? spoken[0];
  const url = chosen?.url ?? chosen?.src;
  if (!url) return [];

  try {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) return [];
    // Canvas serves WebVTT for some tracks and SRT for others. The reader here
    // takes both: it splits on blank lines and looks for a timing, which is all
    // the two formats have in common and all we need from either.
    return parseVtt(await response.text());
  } catch {
    return [];
  }
}

/**
 * Mark the element the overlay attaches to. Canvas positions the video
 * absolutely inside the box that holds the picture, so its offset parent is
 * exactly that box — and being found from the video outwards is the only way to
 * reach it, since every class on the way is a build-specific hash.
 */
function markPlayer(video: HTMLVideoElement): void {
  const box = (video.offsetParent as HTMLElement | null) ?? video.parentElement;
  box?.setAttribute('data-bt-player', '');
}

/** A video that has said something about captions, one way or another. */
function hasCaptionMarkup(video: HTMLVideoElement | null): boolean {
  return Boolean(video && (video.textTracks.length > 0 || video.querySelector('track')));
}

export const canvasMatcher: SiteMatcher = {
  // Any Canvas install, not one school's: the path is Instructure's.
  matches: (loc) => loc.pathname.startsWith('/media_attachments_iframe/'),
  create: createCanvasSite,
};
