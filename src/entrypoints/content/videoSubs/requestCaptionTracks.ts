import { BT_REQ, BT_RES, type CaptionsResponse } from './bridgeProtocol';

export function requestCaptionTracks(timeoutMs = 4000): Promise<CaptionsResponse> {
  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent) => {
      // e.source is null in jsdom (postMessage quirk); in a real browser it is `window`.
      if (e.source !== window && e.source !== null) return;
      const data = e.data as CaptionsResponse;
      if (data?.source !== BT_RES) return;
      cleanup();
      resolve(data);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('caption bridge timeout'));
    }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
    }
    window.addEventListener('message', onMessage);
    window.postMessage({ source: BT_REQ }, '*');
  });
}
