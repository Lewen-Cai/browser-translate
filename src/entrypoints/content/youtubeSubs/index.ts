import { requestCaptionTracks } from './requestCaptionTracks';
import { fetchTranscript, pickTrack } from './fetchTranscript';
import { fetchTranscriptText } from './transcriptBridge';
import { createCueTranslator } from './translateCues';
import {
  createSubtitleOverlay,
  type SubtitleAppearance,
  type SubtitleLines,
} from './subtitleOverlay';
import { mountSubsButton, removeSubsButton, type SubsButtonHandle } from './button';
import type { CaptionsResponse } from './bridgeProtocol';
import { activeCue } from '~/core/subtitles/activeCue';
import type { Cue } from '~/core/subtitles/types';
import { translateBatch, abortTranslate } from '~/messaging/client';
import type { TranslateBatchRequest } from '~/messaging/types';

export interface YouTubeSubsStrings {
  titleOff: string; titleOn: string; noCaptions: string;
  enableCc: string; noTranslationNeeded: string; live: string; failed: string;
  translating: string;
  /** Labels for the in-player handle and settings panel. */
  dragHint: string;
  settings: string;
  fontScale: string;
  backgroundOpacity: string;
  translationOnly: string;
  resetPosition: string;
}

export interface YouTubeSubTranslatorDeps {
  getTargetLang: () => string;
  strings: YouTubeSubsStrings;
  notify: (msg: string) => void;
  concurrency: number;
  /** Vertical position of the subtitle block, persisted across videos. */
  getSubtitleOffsetPct: () => number;
  setSubtitleOffsetPct: (pct: number) => void;
  /** Read live so a settings change reaches an already-playing video. */
  getAppearance: () => SubtitleAppearance;
  setAppearance: (next: SubtitleAppearance) => void;
}

export interface YouTubeSubTranslator {
  attachButton: () => Promise<void>;
  disable: () => void;
  isOn: () => boolean;
}

function videoEl(): HTMLVideoElement | null {
  return document.querySelector<HTMLVideoElement>('video.html5-main-video, video');
}

function currentVideoId(): string {
  return new URLSearchParams(location.search).get('v') ?? '';
}

export function createYouTubeSubTranslator(deps: YouTubeSubTranslatorDeps): YouTubeSubTranslator {
  let on = false;
  let button: SubsButtonHandle | null = null;
  let translator: ReturnType<typeof createCueTranslator> | null = null;
  let overlay: ReturnType<typeof createSubtitleOverlay> | null = null;
  let cues: Cue[] = [];
  let rafId = 0;
  let pumpTarget: HTMLVideoElement | null = null;
  let enabledVideoId = '';
  // Caption tracks probed up front in attachButton(); reused by enable() so we don't
  // round-trip the MAIN-world bridge twice. Null if the probe hasn't run / failed.
  let probed: CaptionsResponse | null = null;

  function trackPref(captions: CaptionsResponse) {
    return { activeVssId: captions.activeVssId, activeLanguageCode: captions.activeLanguageCode };
  }

  function currentTimeMs(): number {
    return Math.round((videoEl()?.currentTime ?? 0) * 1000);
  }

  // The lines to draw right now, straight from the transcript's own timing.
  // Stable closure so the overlay (created before the cues are fetched) always
  // sees the latest state.
  function getLines(): SubtitleLines | null {
    const cue = activeCue(currentTimeMs(), cues);
    if (!cue) return null;
    return {
      original: cue.text,
      translation: translator?.get(cue.id) ?? null,
      failed: translator?.isFailed(cue.id) ?? false,
    };
  }

  function tick(): void {
    // YouTube SPA-navigated to a different video → drop everything (otherwise the
    // previous video's cues would be shown against the new captions).
    if (on && currentVideoId() !== enabledVideoId) {
      disable();
      return;
    }
    overlay?.refresh();
    rafId = requestAnimationFrame(tick);
  }

  async function enable(): Promise<void> {
    if (on) return;
    on = true;
    enabledVideoId = currentVideoId();
    button?.setActive(true);

    // Start the overlay immediately. Until the transcript arrives getLines()
    // returns null, and once it does the original shows straight away with the
    // "translating…" placeholder beneath it — the subtitle is never blank while
    // a translation is in flight.
    overlay = createSubtitleOverlay({
      strings: {
        placeholder: deps.strings.translating,
        dragHint: deps.strings.dragHint,
        settings: deps.strings.settings,
        fontScale: deps.strings.fontScale,
        backgroundOpacity: deps.strings.backgroundOpacity,
        translationOnly: deps.strings.translationOnly,
        resetPosition: deps.strings.resetPosition,
      },
      getLines,
      getOffsetPct: deps.getSubtitleOffsetPct,
      onOffsetChange: deps.setSubtitleOffsetPct,
      getAppearance: deps.getAppearance,
      onAppearanceChange: deps.setAppearance,
    });
    overlay.start();
    rafId = requestAnimationFrame(tick);

    let captions = probed;
    if (!captions) {
      try {
        captions = await requestCaptionTracks();
      } catch {
        deps.notify(deps.strings.enableCc);
        disable();
        return;
      }
      if (!on) return; // user toggled off during the await
    }

    if (captions.isLive) { deps.notify(deps.strings.live); disable(); return; }
    const track = pickTrack(captions.tracks, trackPref(captions));
    if (!track) {
      deps.notify(deps.strings.noCaptions);
      disable();
      return;
    }
    const target = deps.getTargetLang();
    if (track.languageCode && target.startsWith(track.languageCode)) {
      deps.notify(deps.strings.noTranslationNeeded); disable(); return;
    }

    let fetched;
    try {
      fetched = await fetchTranscript(track.languageCode, fetchTranscriptText);
    } catch {
      deps.notify(deps.strings.failed);
      disable();
      return;
    }
    if (!on) return; // user toggled off during the await
    if (fetched.length === 0) { deps.notify(deps.strings.noCaptions); disable(); return; }
    cues = fetched;

    translator = createCueTranslator({
      translateBatchFn: (req) => translateBatch(req as TranslateBatchRequest),
      abortFn: abortTranslate,
      getTargetLang: deps.getTargetLang,
      getCurrentTimeMs: currentTimeMs,
      getPlaybackRate: () => videoEl()?.playbackRate ?? 1,
      onUpdate: () => overlay?.refresh(),
      concurrency: deps.concurrency,
    });
    translator.start(cues);

    // Translation follows the playhead rather than draining the track, so it has
    // to be nudged as the video moves. timeupdate fires a few times a second,
    // which is plenty to keep the look-ahead window filled.
    pumpTarget = videoEl();
    pumpTarget?.addEventListener('timeupdate', pump);
    pumpTarget?.addEventListener('seeked', pump);
    pumpTarget?.addEventListener('ratechange', pump);
    pump();
  }

  function pump(): void {
    translator?.pump();
  }

  function detachPump(): void {
    pumpTarget?.removeEventListener('timeupdate', pump);
    pumpTarget?.removeEventListener('seeked', pump);
    pumpTarget?.removeEventListener('ratechange', pump);
    pumpTarget = null;
  }

  function disable(): void {
    if (!on) return;
    on = false;
    button?.setActive(false);
    cancelAnimationFrame(rafId);
    detachPump();
    translator?.teardown();
    overlay?.teardown();
    translator = null;
    overlay = null;
    cues = [];
  }

  async function attachButton(): Promise<void> {
    // Probe the caption tracks up front so we can hide the button on videos that have
    // no translatable (manual) track — auto-generated (asr) captions render in a way
    // that covers our injected line, so we don't translate them.
    try {
      probed = await requestCaptionTracks();
    } catch {
      probed = null; // bridge not ready / timed out
    }
    // Positively know there's no manual track → don't mount, and clear any button left
    // over from a previous video (the control bar persists across SPA navigation).
    if (probed && pickTrack(probed.tracks) === null) {
      removeSubsButton();
      return;
    }
    // Manual track present, or probe failed (mount anyway as a graceful fallback —
    // enable() re-probes and notifies if it turns out to be unsupported).
    button = mountSubsButton({
      titleOff: deps.strings.titleOff,
      titleOn: deps.strings.titleOn,
      onToggle: () => { if (on) disable(); else void enable(); },
    });
  }

  return { attachButton, disable, isOn: () => on };
}
