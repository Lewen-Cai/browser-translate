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
  it('uses the asr track when that is all the video has', () => {
    const tracks: CaptionTrack[] = [{ baseUrl: 'a', languageCode: 'fr', kind: 'asr' }];
    expect(pickTrack(tracks)?.baseUrl).toBe('a');
  });
  it('picks among asr tracks when every track is auto-generated', () => {
    const tracks: CaptionTrack[] = [
      { baseUrl: 'en-asr', languageCode: 'en', kind: 'asr' },
      { baseUrl: 'ja-asr', languageCode: 'ja', kind: 'asr' },
    ];
    expect(pickTrack(tracks)?.baseUrl).toBe('en-asr');
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

  it('honours an explicitly displayed asr track', () => {
    // The viewer chose the auto-generated track, so translate what they can see.
    const tracks: CaptionTrack[] = [
      { baseUrl: 'en-asr', languageCode: 'en', kind: 'asr', vssId: 'a.en' },
      { baseUrl: 'en', languageCode: 'en', vssId: '.en' },
    ];
    expect(pickTrack(tracks, { activeVssId: 'a.en' })?.baseUrl).toBe('en-asr');
  });

  it('picks the active language (manual only) when no vssId match', () => {
    const tracks: CaptionTrack[] = [
      { baseUrl: 'ar', languageCode: 'ar' },
      { baseUrl: 'en-asr', languageCode: 'en', kind: 'asr' },
      { baseUrl: 'en', languageCode: 'en' },
    ];
    expect(pickTrack(tracks, { activeLanguageCode: 'en' })?.baseUrl).toBe('en');
  });

  it('uses the asr language as a hint to pick the original-language manual track', () => {
    // First track is an unrelated language (Arabic); original spoken language is
    // English (asr). The manual English track is the better source of the two.
    const tracks: CaptionTrack[] = [
      { baseUrl: 'ar', languageCode: 'ar' },
      { baseUrl: 'en-asr', languageCode: 'en', kind: 'asr' },
      { baseUrl: 'en', languageCode: 'en' },
    ];
    expect(pickTrack(tracks)?.baseUrl).toBe('en');
  });

  it('falls back to the first manual track when the asr hint has no manual match', () => {
    const tracks: CaptionTrack[] = [
      { baseUrl: 'ja', languageCode: 'ja' },
      { baseUrl: 'en-asr', languageCode: 'en', kind: 'asr' },
    ];
    // asr is English but the only manual track is Japanese → the manual track's
    // wording and timing still beat auto-generated text.
    expect(pickTrack(tracks)?.baseUrl).toBe('ja');
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
