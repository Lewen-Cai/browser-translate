import { cuesFromTextTrack, pickTextTrack } from '../textTracks';
import type { SiteMatcher, SiteProbe, SubtitleSite } from '../site';
import type { Cue } from '~/core/subtitles/types';

/**
 * Any page with an HTML5 video that carries its own caption track.
 *
 * This is the adapter that makes the feature about video rather than about
 * YouTube. A `<track>` is the standard way a page ships captions, the browser
 * has already parsed it, and reading the cues out costs one property access —
 * so anywhere a player uses one, subtitles work with no site-specific code at
 * all. Zoom's recordings and most video.js and Video-embed players land here.
 *
 * The overlay attaches to the video's own offset parent rather than to a named
 * container: every player wraps its video in something positioned, because it
 * has to draw controls over the picture itself.
 */

/** Players whose wrapper is worth preferring over a bare offset parent. */
const KNOWN_WRAPPERS = '.video-js, .vjs-tech ~ *, .plyr, .jwplayer, .video-container';

export function createGenericSite(): SubtitleSite {
  return {
    id: 'generic',
    selectors: {
      // Resolved live: the wrapper is found from the video, and the video may
      // not exist yet when the adapter is built.
      player: `${KNOWN_WRAPPERS}, [data-bt-player]`,
      controls: '.vjs-control-bar, .plyr__controls, .jw-controlbar',
      // A page's own captions are its business — we do not know the markup, and
      // guessing at it would risk hiding part of the player.
    },
    button: {
      container: '.vjs-control-bar, .plyr__controls, .jw-controlbar',
      place: 'end',
      width: '40px',
    },

    findVideo: () => findVideo(),

    // One page, one recording, in every player this adapter is meant for. A
    // site that swaps media in place gets its own adapter, where the key can
    // say so.
    mediaKey: () => location.pathname + location.search,

    async probe(): Promise<SiteProbe> {
      const video = findVideo();
      if (!video) return { kind: 'none' };
      markPlayer(video);
      const track = pickTextTrack(video.textTracks);
      if (!track) {
        // Tracks are declared in the markup but their cues load lazily, and a
        // player may add the track only once playback starts. Absent tracks
        // this early are not proof there are none.
        return video.textTracks.length === 0 && !video.querySelector('track')
          ? { kind: 'none' }
          : { kind: 'unknown' };
      }
      return { kind: 'ready', languageCode: track.language || undefined };
    },

    async fetchTranscript(): Promise<Cue[]> {
      const video = findVideo();
      if (!video) throw new Error('no video');
      markPlayer(video);
      const track = pickTextTrack(video.textTracks);
      if (!track) throw new Error('no caption track');
      return cuesFromTextTrack(track);
    },
  };
}

/** The biggest video on the page — the one being watched, on a page with more. */
function findVideo(): HTMLVideoElement | null {
  const videos = [...document.querySelectorAll<HTMLVideoElement>('video')];
  if (videos.length <= 1) return videos[0] ?? null;
  return videos.reduce((best, v) =>
    v.clientWidth * v.clientHeight > best.clientWidth * best.clientHeight ? v : best);
}

/**
 * Mark the element the overlay should attach to, so a plain CSS selector can
 * find it later. The wrapper differs per player and can only be found from the
 * video outwards, but the UI takes a selector — this is the join between them.
 */
function markPlayer(video: HTMLVideoElement): void {
  const wrapper = video.closest<HTMLElement>(KNOWN_WRAPPERS)
    ?? (video.offsetParent as HTMLElement | null)
    ?? video.parentElement;
  if (!wrapper) return;
  for (const marked of document.querySelectorAll('[data-bt-player]')) {
    if (marked !== wrapper) marked.removeAttribute('data-bt-player');
  }
  wrapper.setAttribute('data-bt-player', '');
}

export const genericMatcher: SiteMatcher = {
  // Last in the list, so a site with an adapter of its own is never handled
  // here. Whether this page actually has a video is probe()'s question.
  matches: () => true,
  create: createGenericSite,
};
