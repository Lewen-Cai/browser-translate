import { describe, it, expect, vi, afterEach } from 'vitest';
import { pickTrack, fetchTranscript } from './fetchTranscript';
import type { CaptionTrack } from './bridgeProtocol';

describe('pickTrack', () => {
  it('prefers a manual track over asr', () => {
    const tracks: CaptionTrack[] = [
      { baseUrl: 'a', languageCode: 'en', kind: 'asr' },
      { baseUrl: 'b', languageCode: 'en' },
    ];
    expect(pickTrack(tracks)?.baseUrl).toBe('b');
  });
  it('falls back to the first track', () => {
    const tracks: CaptionTrack[] = [{ baseUrl: 'a', languageCode: 'fr', kind: 'asr' }];
    expect(pickTrack(tracks)?.baseUrl).toBe('a');
  });
  it('returns null for no tracks', () => {
    expect(pickTrack([])).toBeNull();
  });

  it('picks the active track by vssId over everything else', () => {
    const tracks: CaptionTrack[] = [
      { baseUrl: 'ar', languageCode: 'ar' },
      { baseUrl: 'en', languageCode: 'en', vssId: '.en' },
      { baseUrl: 'es', languageCode: 'es' },
    ];
    expect(pickTrack(tracks, { activeVssId: '.en' })?.baseUrl).toBe('en');
  });

  it('picks the active language (manual over asr) when no vssId match', () => {
    const tracks: CaptionTrack[] = [
      { baseUrl: 'ar', languageCode: 'ar' },
      { baseUrl: 'en-asr', languageCode: 'en', kind: 'asr' },
      { baseUrl: 'en', languageCode: 'en' },
    ];
    expect(pickTrack(tracks, { activeLanguageCode: 'en' })?.baseUrl).toBe('en');
  });

  it('infers original language from the asr track when no active preference', () => {
    // First track is an unrelated language (Arabic); original spoken language is English (asr).
    const tracks: CaptionTrack[] = [
      { baseUrl: 'ar', languageCode: 'ar' },
      { baseUrl: 'en-asr', languageCode: 'en', kind: 'asr' },
      { baseUrl: 'en', languageCode: 'en' },
    ];
    expect(pickTrack(tracks)?.baseUrl).toBe('en');
  });

  it('does not blindly pick the first track on a multi-language video', () => {
    const tracks: CaptionTrack[] = [
      { baseUrl: 'ar', languageCode: 'ar' },
      { baseUrl: 'en-asr', languageCode: 'en', kind: 'asr' },
    ];
    // asr language (en) is the original → pick the en asr, not Arabic.
    expect(pickTrack(tracks)?.baseUrl).toBe('en-asr');
  });
});

describe('fetchTranscript', () => {
  afterEach(() => vi.restoreAllMocks());
  it('fetches by language code and parses the body into cues', async () => {
    const body = JSON.stringify({
      events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: 'Hi' }] }],
    });
    const fetchText = vi.fn().mockResolvedValue(body);
    const cues = await fetchTranscript('en', fetchText);
    expect(fetchText).toHaveBeenCalledWith('en');
    expect(cues).toEqual([{ id: 0, startMs: 0, endMs: 1000, text: 'Hi' }]);
  });
  it('propagates fetcher errors', async () => {
    const fetchText = vi.fn().mockRejectedValue(new Error('bridge timeout'));
    await expect(fetchTranscript('en', fetchText)).rejects.toThrow('bridge timeout');
  });
  it('returns [] for an empty body', async () => {
    const fetchText = vi.fn().mockResolvedValue('');
    expect(await fetchTranscript('en', fetchText)).toEqual([]);
  });
});
