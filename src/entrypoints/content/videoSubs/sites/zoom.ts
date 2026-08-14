import { parseVtt } from '~/core/subtitles/parseVtt';
import { pickTextTrack, cuesFromTextTrack } from '../textTracks';
import type { SiteMatcher, SiteProbe, SubtitleSite } from '../site';
import type { Cue } from '~/core/subtitles/types';

/**
 * Zoom cloud recordings.
 *
 * Zoom plays through video.js, so the overlay and the button need nothing
 * special — but the transcript is not attached to the video as a track. It sits
 * behind Zoom's own endpoint, keyed by the same file id the media stream is
 * keyed by, which is why the id is read back out of the video's source rather
 * than out of the address: a recording page's URL carries a share token, not a
 * file id, and the id changes when a multi-part recording moves on.
 *
 * The request is same-origin and goes out with the session cookie the reader is
 * already watching with, so a recording they cannot see is a recording we
 * cannot read either — which is the right way round.
 */

const TRANSCRIPT_PATH = '/rec/play/vtt';

export function createZoomSite(): SubtitleSite {
  return {
    id: 'zoom',
    selectors: {
      player: '.video-js',
      controls: '.vjs-control-bar',
      // Zoom draws its own transcript in a side panel rather than over the
      // picture, so there is nothing over the video to hide.
    },
    button: {
      container: '.vjs-control-bar',
      className: 'vjs-control vjs-button',
      place: 'end',
      width: '40px',
    },

    findVideo: () => document.querySelector<HTMLVideoElement>('video'),

    // A share link plays one recording. A multi-part recording swaps the source
    // in place, and that is what the file id below moves with.
    mediaKey: () => fileId() ?? location.pathname,

    async probe(): Promise<SiteProbe> {
      // Whether a recording was transcribed can only be learned by asking for
      // the transcript, and doing that on every recording page — before anyone
      // has asked for a translation — would be a request we have no business
      // making. So the toggle is offered, and the answer comes when it is
      // pressed. A page with no player at all is the one certain no.
      return document.querySelector('video') ? { kind: 'unknown' } : { kind: 'none' };
    },

    async fetchTranscript(): Promise<Cue[]> {
      const id = fileId();
      if (id) {
        const url = `${TRANSCRIPT_PATH}?type=transcript&fid=${encodeURIComponent(id)}`;
        const response = await fetch(url, { credentials: 'same-origin' });
        if (response.ok) {
          const cues = parseVtt(await response.text());
          if (cues.length > 0) return cues;
        }
      }
      // A recording with captions rather than a transcript carries them as a
      // track like any other player would, so it is worth asking.
      const video = document.querySelector<HTMLVideoElement>('video');
      const track = pickTextTrack(video?.textTracks);
      if (track) return cuesFromTextTrack(track);
      throw new Error('no Zoom transcript');
    },
  };
}

/**
 * The recording's file id, taken from whatever the player is currently playing.
 * Zoom's media URLs carry it as `fid`; a source that does not is a page we
 * cannot ask about.
 */
function fileId(): string | null {
  const src = document.querySelector<HTMLVideoElement>('video')?.currentSrc;
  if (!src) return null;
  try {
    return new URL(src, location.href).searchParams.get('fid');
  } catch {
    return null;
  }
}

export const zoomMatcher: SiteMatcher = {
  // Zoom serves recordings from many regional hosts (us02web, eu01web, …) and
  // from its own vanity domains, all under zoom.us.
  matches: (loc) => loc.hostname.endsWith('zoom.us') && loc.pathname.startsWith('/rec/'),
  create: createZoomSite,
};
