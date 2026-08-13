import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('~/messaging/client', () => ({
  translateBatch: vi.fn(async (req: { segments: string[] }) => req.segments.map((s) => `译:${s}`)),
  abortTranslate: vi.fn(),
}));
vi.mock('./requestCaptionTracks', () => ({
  requestCaptionTracks: vi.fn(async () => ({
    source: 'bt-yt-captions-response',
    isLive: false,
    tracks: [{ baseUrl: 'u', languageCode: 'en' }],
  })),
}));
vi.mock('./fetchTranscript', async (orig) => {
  const actual = (await orig()) as object;
  return {
    ...actual,
    fetchTranscript: vi.fn(async () => [{ id: 0, startMs: 0, endMs: 5000, text: 'Hello' }]),
  };
});

import { createYouTubeSubTranslator, type YouTubeSubsStrings } from './index';
import { DEFAULT_SUBTITLE_POSITION, DEFAULT_SUBTITLE_STYLE } from '~/core/subtitles/style';
import { requestCaptionTracks } from './requestCaptionTracks';
import { fetchTranscript } from './fetchTranscript';
import { translateBatch } from '~/messaging/client';

const STRINGS: YouTubeSubsStrings = {
  titleOff: 'off',
  titleOn: 'on',
  noCaptions: 'nc',
  enableCc: 'cc',
  noTranslationNeeded: 'nt',
  live: 'lv',
  failed: 'fail',
  placeholder: 'tr',
  dragHint: 'drag',
  subtitlesToggle: 'subs',
  styleTitle: 'style',
  general: 'general',
  displayMode: 'mode',
  displayBilingual: 'bi',
  displayOriginalOnly: 'orig',
  displayTranslationOnly: 'trans',
  translationPosition: 'pos',
  positionAbove: 'above',
  positionBelow: 'below',
  backgroundOpacity: 'bg',
  mainSubtitle: 'main',
  translationSubtitle: 'translation',
  fontScale: 'size',
  color: 'color',
  fontFamily: 'font',
  fontWeight: 'weight',
  reset: 'reset',
  resetPosition: 'reset position',
  back: 'back',
};

function make(overrides: { notify?: (m: string) => void } = {}) {
  return createYouTubeSubTranslator({
    getTargetLang: () => 'zh-CN',
    strings: STRINGS,
    notify: overrides.notify ?? vi.fn(),
    concurrency: 1,
    getPosition: () => DEFAULT_SUBTITLE_POSITION,
    setPosition: vi.fn(),
    getStyle: () => DEFAULT_SUBTITLE_STYLE,
    setStyle: vi.fn(),
  });
}

/** The control-bar button opens the menu; the switch inside it starts translation. */
function subsSwitch(): HTMLElement {
  const host = document.querySelector<HTMLElement>('.bt-yt-subs');
  const el = host?.shadowRoot?.querySelector<HTMLElement>('.switch');
  if (!el) throw new Error('subtitles switch not mounted');
  return el;
}

function openMenu(): void {
  document.querySelector<HTMLButtonElement>('.bt-yt-subs-button')!.click();
}

function turnOn(): void {
  openMenu();
  subsSwitch().click();
}

const asrOnly = {
  source: 'bt-yt-captions-response',
  isLive: false,
  tracks: [{ baseUrl: 'u', languageCode: 'en', kind: 'asr' }],
};

const noTracks = { source: 'bt-yt-captions-response', isLive: false, tracks: [] };

/** Subtitle lines live in the overlay's shadow root. */
function subtitleLine(selector: string): string | undefined {
  const host = document.querySelector<HTMLElement>('.bt-yt-subs');
  return host?.shadowRoot?.querySelector<HTMLElement>(selector)?.textContent ?? undefined;
}

/** Let queued microtasks (the chained awaits inside enable) settle. */
async function flush() {
  for (let i = 0; i < 6; i++) await Promise.resolve();
}

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML =
    '<div id="movie_player">' +
    '<div class="ytp-right-controls"></div>' +
    '<video></video>' +
    '<div class="ytp-caption-window-container"><span class="ytp-caption-segment">Hello</span></div>' +
    '</div>';
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0 as unknown as number);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

describe('createYouTubeSubTranslator', () => {
  it('mounts the button (manual track present), enables, translates, injects, tears down', async () => {
    const t = make();
    await t.attachButton();
    const btn = document.querySelector<HTMLButtonElement>('.bt-yt-subs-button');
    expect(btn).not.toBeNull();
    turnOn();
    await flush();
    expect(t.isOn()).toBe(true);
    // Both lines are ours: the transcript's own text on top, translation below.
    expect(subtitleLine('.line-main')).toBe('Hello');
    expect(subtitleLine('.line-translation')).toBe('译:Hello');
    t.teardown();
    expect(t.isOn()).toBe(false);
    expect(document.querySelector('.bt-yt-subs')).toBeNull();
  });

  it('mounts the button on a video that only has auto-generated captions', async () => {
    vi.mocked(requestCaptionTracks).mockResolvedValueOnce(asrOnly as never);
    const t = make();
    await t.attachButton();
    expect(document.querySelector('.bt-yt-subs-button')).not.toBeNull();
  });

  it('removes a stale button left over from a previous video when the new one has no captions', async () => {
    document.querySelector('.ytp-right-controls')!.innerHTML =
      '<button class="ytp-button bt-yt-subs-button"></button>';
    vi.mocked(requestCaptionTracks).mockResolvedValueOnce(noTracks as never);
    const t = make();
    await t.attachButton();
    expect(document.querySelector('.bt-yt-subs-button')).toBeNull();
  });

  it('mounts the button anyway when the up-front probe fails (graceful fallback)', async () => {
    vi.mocked(requestCaptionTracks).mockRejectedValueOnce(new Error('bridge timeout'));
    const t = make();
    await t.attachButton();
    expect(document.querySelector('.bt-yt-subs-button')).not.toBeNull();
  });

  it('reuses the probed captions on enable instead of probing again', async () => {
    const t = make();
    await t.attachButton();
    expect(vi.mocked(requestCaptionTracks)).toHaveBeenCalledTimes(1);
    turnOn();
    await flush();
    expect(vi.mocked(requestCaptionTracks)).toHaveBeenCalledTimes(1);
    expect(t.isOn()).toBe(true);
    t.disable(); // tear down the injector observer so it doesn't leak into later tests
  });

  it('reports no captions when a fallback-mounted button is clicked on a video without any', async () => {
    vi.mocked(requestCaptionTracks)
      .mockRejectedValueOnce(new Error('bridge timeout')) // probe fails → button mounts
      .mockResolvedValueOnce(noTracks as never); // enable re-fetch → nothing to translate
    const notify = vi.fn();
    const t = make({ notify });
    await t.attachButton();
    turnOn();
    await flush();
    expect(notify).toHaveBeenCalledWith('nc');
    expect(t.isOn()).toBe(false);
  });

  it('does not start translation if toggled off during the transcript-fetch gap', async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    vi.mocked(fetchTranscript).mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolveFetch = r as (v: unknown) => void;
        }),
    );
    const t = make();
    await t.attachButton();
    turnOn();
    await flush();
    expect(t.isOn()).toBe(true);
    t.disable(); // user toggles off while fetchTranscript is pending
    expect(t.isOn()).toBe(false);
    resolveFetch([{ id: 0, startMs: 0, endMs: 5000, text: 'Hello' }]);
    await flush();
    expect(t.isOn()).toBe(false);
    expect(document.querySelector('.bt-yt-translation')).toBeNull();
    expect(vi.mocked(translateBatch)).not.toHaveBeenCalled();
  });

  it('notifies failed (not enableCc) when transcript fetch fails', async () => {
    vi.mocked(fetchTranscript).mockRejectedValueOnce(new Error('timedtext fetch failed: 404'));
    const notify = vi.fn();
    const t = make({ notify });
    await t.attachButton();
    turnOn();
    await flush();
    expect(notify).toHaveBeenCalledWith('fail');
    expect(notify).not.toHaveBeenCalledWith('cc');
    expect(t.isOn()).toBe(false);
  });
});
