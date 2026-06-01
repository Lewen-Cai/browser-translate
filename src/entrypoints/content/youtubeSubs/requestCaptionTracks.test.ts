import { describe, it, expect, afterEach } from 'vitest';
import { requestCaptionTracks } from './requestCaptionTracks';
import { BT_REQ, BT_RES } from './bridgeProtocol';

describe('requestCaptionTracks', () => {
  let responder: ((e: MessageEvent) => void) | null = null;

  afterEach(() => {
    if (responder) window.removeEventListener('message', responder);
    responder = null;
  });

  it('resolves with tracks when the bridge responds', async () => {
    // Fake MAIN-world responder.
    responder = (e) => {
      if ((e.data as { source?: string })?.source !== BT_REQ) return;
      window.postMessage(
        { source: BT_RES, isLive: false, tracks: [{ baseUrl: 'u', languageCode: 'en' }] },
        '*',
      );
    };
    window.addEventListener('message', responder);
    const res = await requestCaptionTracks(1000);
    expect(res.isLive).toBe(false);
    expect(res.tracks).toEqual([{ baseUrl: 'u', languageCode: 'en' }]);
  });

  it('rejects on timeout when no bridge answers', async () => {
    await expect(requestCaptionTracks(50)).rejects.toThrow(/timeout/i);
  });
});
