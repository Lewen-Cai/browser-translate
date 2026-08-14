import { createCueTranslator } from './translateCues';
import {
  createSubtitlesUi,
  type SubtitleLines,
  type SubtitleUiStrings,
} from './subtitlesUi';
import { mountSubsButton, removeSubsButton, type SubsButtonHandle } from './button';
import type { SubtitleSite } from './site';
import { activeCue } from '~/core/subtitles/activeCue';
import type { Cue } from '~/core/subtitles/types';
import type { SubtitlePosition, SubtitleStyle } from '~/core/subtitles/style';
import { translateBatch, abortTranslate } from '~/messaging/client';
import type { TranslateBatchRequest } from '~/messaging/types';

export interface VideoSubsStrings extends SubtitleUiStrings {
  titleOff: string; titleOn: string; noCaptions: string;
  enableCc: string; noTranslationNeeded: string; live: string; failed: string;
}

export interface VideoSubTranslatorDeps {
  /** Which player this is. Everything site-shaped lives behind it. */
  site: SubtitleSite;
  getTargetLang: () => string;
  strings: VideoSubsStrings;
  notify: (msg: string) => void;
  concurrency: number;
  /** Read live so a settings change reaches an already-playing video. */
  getPosition: () => SubtitlePosition;
  setPosition: (next: SubtitlePosition) => void;
  getStyle: () => SubtitleStyle;
  setStyle: (next: SubtitleStyle) => void;
}

export interface VideoSubTranslator {
  attachButton: () => Promise<void>;
  disable: () => void;
  /** Stop translating and take the whole in-player UI back down. */
  teardown: () => void;
  isOn: () => boolean;
}

export function createVideoSubTranslator(deps: VideoSubTranslatorDeps): VideoSubTranslator {
  const { site } = deps;
  let on = false;
  let button: SubsButtonHandle | null = null;
  let translator: ReturnType<typeof createCueTranslator> | null = null;
  // The in-player UI outlives on/off: the menu that turns translation on lives
  // inside it, so it has to be there before there is anything to translate.
  let ui: ReturnType<typeof createSubtitlesUi> | null = null;
  let cues: Cue[] = [];
  let rafId = 0;
  let pumpTarget: HTMLVideoElement | null = null;
  let enabledMediaKey = '';

  function currentTimeMs(): number {
    return Math.round((site.findVideo()?.currentTime ?? 0) * 1000);
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

  function ensureUi(): ReturnType<typeof createSubtitlesUi> {
    if (ui) return ui;
    ui = createSubtitlesUi({
      selectors: site.selectors,
      getLines,
      getTargetLang: deps.getTargetLang,
      strings: deps.strings,
      getPosition: deps.getPosition,
      onPositionChange: deps.setPosition,
      getStyle: deps.getStyle,
      onStyleChange: deps.setStyle,
      isActive: () => on,
      onActiveChange: (next) => { if (next) void enable(); else disable(); },
    });
    return ui;
  }

  function tick(): void {
    // The page moved to different media → drop everything, or the previous
    // video's cues would be drawn over the new one.
    if (on && site.mediaKey() !== enabledMediaKey) {
      disable();
      return;
    }
    ui?.refresh();
    rafId = requestAnimationFrame(tick);
  }

  async function enable(): Promise<void> {
    if (on) return;
    on = true;
    enabledMediaKey = site.mediaKey();
    button?.setActive(true);

    // Show the subtitles immediately. Until the transcript arrives getLines()
    // returns null, and once it does the original shows straight away with the
    // "translating…" placeholder beneath it — the subtitle is never blank while
    // a translation is in flight.
    ensureUi().setActive(true);
    rafId = requestAnimationFrame(tick);

    const probe = await site.probe();
    if (!on) return; // reader toggled off during the await
    if (probe.kind === 'live') { deps.notify(deps.strings.live); disable(); return; }
    if (probe.kind === 'none') { deps.notify(deps.strings.noCaptions); disable(); return; }
    if (probe.kind === 'unknown') { deps.notify(deps.strings.enableCc); disable(); return; }

    const target = deps.getTargetLang();
    if (probe.languageCode && target.startsWith(probe.languageCode)) {
      deps.notify(deps.strings.noTranslationNeeded); disable(); return;
    }

    let fetched: Cue[];
    try {
      fetched = await site.fetchTranscript();
    } catch {
      deps.notify(deps.strings.failed);
      disable();
      return;
    }
    if (!on) return; // reader toggled off during the await
    if (fetched.length === 0) { deps.notify(deps.strings.noCaptions); disable(); return; }
    cues = fetched;

    translator = createCueTranslator({
      translateBatchFn: (req) => translateBatch(req as TranslateBatchRequest),
      abortFn: abortTranslate,
      getTargetLang: deps.getTargetLang,
      getCurrentTimeMs: currentTimeMs,
      getPlaybackRate: () => site.findVideo()?.playbackRate ?? 1,
      onUpdate: () => ui?.refresh(),
      concurrency: deps.concurrency,
    });
    translator.start(cues);

    // Translation follows the playhead rather than draining the track, so it has
    // to be nudged as the video moves. timeupdate fires a few times a second,
    // which is plenty to keep the look-ahead window filled.
    pumpTarget = site.findVideo();
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
    translator = null;
    cues = [];
    // The UI stays: its menu is how translation gets turned back on.
    ui?.setActive(false);
  }

  function teardown(): void {
    disable();
    ui?.teardown();
    ui = null;
  }

  async function attachButton(): Promise<void> {
    // Probe up front so the toggle is never offered on media that has nothing to
    // translate. Only a definite no hides it — a site that cannot tell yet gets
    // the button, and says so when it is pressed.
    const probe = await site.probe();
    if (probe.kind === 'none') {
      removeSubsButton();
      teardown();
      return;
    }
    if (site.button) {
      button = mountSubsButton(site.button, {
        titleOff: deps.strings.titleOff,
        titleOn: deps.strings.titleOn,
        // The button opens the menu rather than translating outright: the same
        // press has to reach the style settings, which are useless once the video
        // has moved on and the reader has to hunt for them.
        onToggle: () => ensureUi().togglePanel(),
      });
      button.setActive(on);
    }
    ensureUi();
  }

  return { attachButton, disable, teardown, isOn: () => on };
}
