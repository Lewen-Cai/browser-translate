import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('~/messaging/client', () => ({
  translateBatch: vi.fn(async (req: { segments: string[] }) => req.segments.map((s) => `译:${s}`)),
  abortTranslate: vi.fn(),
}));
vi.mock('./requestCaptionTracks', () => ({
  requestCaptionTracks: vi.fn(async () => ({
    source: 'bt-yt-captions-response', isLive: false,
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

import { createYouTubeSubTranslator } from './index';
import { requestCaptionTracks } from './requestCaptionTracks';
import { fetchTranscript } from './fetchTranscript';
import { translateBatch } from '~/messaging/client';

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML =
    '<div class="ytp-right-controls"></div>' +
    '<video></video>' +
    '<div class="ytp-caption-window-container"><span class="ytp-caption-segment">Hello</span></div>';
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0 as unknown as number);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

describe('createYouTubeSubTranslator', () => {
  it('enables, translates, injects, and tears down', async () => {
    const t = createYouTubeSubTranslator({
      getTargetLang: () => 'zh-CN',
      strings: {
        titleOff: 'off', titleOn: 'on', noCaptions: 'nc', enableCc: 'cc',
        noTranslationNeeded: 'nt', live: 'lv', failed: 'fail', translating: 'tr',
      },
      notify: vi.fn(),
      concurrency: 1,
    });
    t.attachButton();
    const btn = document.querySelector<HTMLButtonElement>('.bt-yt-subs-button')!;
    btn.click();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(t.isOn()).toBe(true);
    const line = document.querySelector('.bt-yt-translation');
    expect(line?.textContent).toBe('译:Hello');
    t.disable();
    expect(t.isOn()).toBe(false);
    expect(document.querySelector('.bt-yt-translation')).toBeNull();
  });

  it('does not start translation if toggled off during the async gap', async () => {
    let resolveTracks: (v: unknown) => void = () => {};
    vi.mocked(requestCaptionTracks).mockImplementationOnce(
      () => new Promise((r) => { resolveTracks = r as (v: unknown) => void; }),
    );
    const t = createYouTubeSubTranslator({
      getTargetLang: () => 'zh-CN',
      strings: { titleOff: 'off', titleOn: 'on', noCaptions: 'nc', enableCc: 'cc', noTranslationNeeded: 'nt', live: 'lv', failed: 'fail', translating: 'tr' },
      notify: vi.fn(),
      concurrency: 1,
    });
    t.attachButton();
    document.querySelector<HTMLButtonElement>('.bt-yt-subs-button')!.click();
    expect(t.isOn()).toBe(true);
    t.disable(); // user toggles off while requestCaptionTracks is pending
    expect(t.isOn()).toBe(false);
    resolveTracks({ source: 'bt-yt-captions-response', isLive: false, tracks: [{ baseUrl: 'u', languageCode: 'en' }] });
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(t.isOn()).toBe(false);
    expect(document.querySelector('.bt-yt-translation')).toBeNull();
    expect(vi.mocked(translateBatch)).not.toHaveBeenCalled();
  });

  it('notifies failed (not enableCc) when transcript fetch fails', async () => {
    vi.mocked(fetchTranscript).mockRejectedValueOnce(new Error('timedtext fetch failed: 404'));
    const notify = vi.fn();
    const t = createYouTubeSubTranslator({
      getTargetLang: () => 'zh-CN',
      strings: { titleOff: 'off', titleOn: 'on', noCaptions: 'nc', enableCc: 'cc', noTranslationNeeded: 'nt', live: 'lv', failed: 'fail', translating: 'tr' },
      notify,
      concurrency: 1,
    });
    t.attachButton();
    document.querySelector<HTMLButtonElement>('.bt-yt-subs-button')!.click();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(notify).toHaveBeenCalledWith('fail');
    expect(notify).not.toHaveBeenCalledWith('cc');
    expect(t.isOn()).toBe(false);
  });
});
