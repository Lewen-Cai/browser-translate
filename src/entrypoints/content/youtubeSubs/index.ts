import { requestCaptionTracks } from './requestCaptionTracks';
import { fetchTranscript, pickTrack } from './fetchTranscript';
import { fetchTranscriptText } from './transcriptBridge';
import { createCueTranslator } from './translateCues';
import { createCaptionInjector } from './injectTranslation';
import { mountSubsButton, type SubsButtonHandle } from './button';
import { activeCue } from '~/core/subtitles/activeCue';
import type { Cue } from '~/core/subtitles/types';
import { translateBatch, abortTranslate } from '~/messaging/client';
import type { TranslateBatchRequest } from '~/messaging/types';

export interface YouTubeSubsStrings {
  titleOff: string; titleOn: string; noCaptions: string;
  enableCc: string; noTranslationNeeded: string; live: string; failed: string;
  translating: string;
}

/** Normalize caption text for matching the on-screen line to a cue. */
function normalizeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

export interface YouTubeSubTranslatorDeps {
  getTargetLang: () => string;
  strings: YouTubeSubsStrings;
  notify: (msg: string) => void;
  concurrency: number;
}

export interface YouTubeSubTranslator {
  attachButton: () => void;
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
  let injector: ReturnType<typeof createCaptionInjector> | null = null;
  let cues: Cue[] = [];
  let textToId = new Map<string, number>();
  let rafId = 0;
  let enabledVideoId = '';

  function currentTimeMs(): number {
    return Math.round((videoEl()?.currentTime ?? 0) * 1000);
  }

  // Resolve the translation for the on-screen native text. Stable closure so the
  // injector (created early, before cues exist) always sees the latest state.
  function getTranslation(nativeText: string): string | undefined {
    const byText = textToId.get(normalizeText(nativeText));
    if (byText !== undefined) {
      const t = translator?.get(byText);
      if (t) return t;
    }
    const c = activeCue(currentTimeMs(), cues);
    return c ? translator?.get(c.id) : undefined;
  }

  function tick(): void {
    // YouTube SPA-navigated to a different video → drop everything (otherwise the
    // previous video's cues would be shown against the new captions).
    if (on && currentVideoId() !== enabledVideoId) {
      disable();
      return;
    }
    injector?.refresh();
    rafId = requestAnimationFrame(tick);
  }

  async function enable(): Promise<void> {
    if (on) return;
    on = true;
    enabledVideoId = currentVideoId();
    button?.setActive(true);

    // Start the overlay immediately: while we fetch + translate, getTranslation
    // returns undefined, so the injector shows the "translating…" placeholder.
    injector = createCaptionInjector({ placeholder: deps.strings.translating, getTranslation });
    injector.start();
    rafId = requestAnimationFrame(tick);

    let captions;
    try {
      captions = await requestCaptionTracks();
    } catch {
      deps.notify(deps.strings.enableCc);
      disable();
      return;
    }
    if (!on) return; // user toggled off during the await

    if (captions.isLive) { deps.notify(deps.strings.live); disable(); return; }
    const track = pickTrack(captions.tracks, {
      activeVssId: captions.activeVssId,
      activeLanguageCode: captions.activeLanguageCode,
    });
    if (!track) { deps.notify(deps.strings.noCaptions); disable(); return; }
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
    textToId = new Map(cues.map((c) => [normalizeText(c.text), c.id]));

    translator = createCueTranslator({
      translateBatchFn: (req) => translateBatch(req as TranslateBatchRequest),
      abortFn: abortTranslate,
      getTargetLang: deps.getTargetLang,
      getCurrentTimeMs: currentTimeMs,
      onUpdate: () => injector?.refresh(),
      concurrency: deps.concurrency,
    });
    void translator.run(cues).catch(() => deps.notify(deps.strings.failed));
  }

  function disable(): void {
    if (!on) return;
    on = false;
    button?.setActive(false);
    cancelAnimationFrame(rafId);
    translator?.teardown();
    injector?.teardown();
    translator = null;
    injector = null;
    cues = [];
    textToId = new Map();
  }

  function attachButton(): void {
    button = mountSubsButton({
      titleOff: deps.strings.titleOff,
      titleOn: deps.strings.titleOn,
      onToggle: () => { if (on) disable(); else void enable(); },
    });
  }

  return { attachButton, disable, isOn: () => on };
}
