import { BT_FETCH_REQ, BT_FETCH_RES, type TranscriptResponse } from './bridgeProtocol';

let seq = 0;

/**
 * Get the transcript for a language via the MAIN-world bridge. The bridge captures
 * the player's own timedtext request (which carries YouTube's poToken) and returns
 * its json3 body — a directly-constructed URL returns an empty body without the token.
 */
export function fetchTranscriptText(lang: string, timeoutMs = 10000): Promise<string> {
  const id = `tx-${++seq}`;
  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as Partial<TranscriptResponse> | undefined;
      if (d?.source !== BT_FETCH_RES || d.id !== id) return;
      cleanup();
      if (d.error) reject(new Error(d.error));
      else resolve(d.body ?? '');
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('transcript bridge timeout'));
    }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
    }
    window.addEventListener('message', onMessage);
    window.postMessage({ source: BT_FETCH_REQ, id, lang }, '*');
  });
}
