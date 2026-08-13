import type {
  PingResponse,
  Request,
  TranslateBatchRequest,
  TranslateBatchResponse,
  TranslateRequest,
  TranslateResponse,
} from './types';

/**
 * After an extension reload/update, content scripts already running in open tabs
 * are orphaned: `chrome.runtime` becomes undefined (or loses its id). Surface a
 * clean, user-actionable error (caught by the card's friendlyError → "refresh
 * this page") instead of a raw "Cannot read properties of undefined" TypeError.
 */
function assertExtensionContext(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    throw new Error('Extension context invalidated — please refresh this page.');
  }
}

export function sendRequest(req: Request): void {
  try {
    void chrome.runtime.sendMessage(req).catch(() => {
      // background may not be ready yet on first install
    });
  } catch {
    // Context invalidated (orphaned content script) — nothing to send.
  }
}

/**
 * Sends a translate request and yields response chunks for the given requestId.
 * Caller owns the requestId and is responsible for unique-ifying it.
 */
export async function* streamTranslate(req: TranslateRequest): AsyncIterable<TranslateResponse> {
  assertExtensionContext();
  const queue: TranslateResponse[] = [];
  let resolveNext: ((v: TranslateResponse | null) => void) | null = null;
  let ended = false;

  const listener = (msg: unknown) => {
    const m = msg as TranslateResponse;
    if (m.requestId !== req.requestId) return;
    if (m.type === 'translate:chunk') {
      if (resolveNext) { resolveNext(m); resolveNext = null; }
      else queue.push(m);
    } else {
      // done or error
      if (resolveNext) { resolveNext(m); resolveNext = null; }
      else queue.push(m);
      ended = true;
      chrome.runtime.onMessage.removeListener(listener);
    }
  };
  chrome.runtime.onMessage.addListener(listener);
  sendRequest(req);

  try {
    while (!ended || queue.length > 0) {
      let next: TranslateResponse | null;
      if (queue.length > 0) {
        next = queue.shift()!;
      } else {
        next = await new Promise<TranslateResponse | null>((r) => { resolveNext = r; });
      }
      if (!next) break;
      yield next;
      if (next.type !== 'translate:chunk') break;
    }
  } finally {
    chrome.runtime.onMessage.removeListener(listener);
  }
}

export function abortTranslate(requestId: string): void {
  sendRequest({ type: 'translate:abort', requestId });
}

/**
 * Tests connectivity to the configured OpenAI-compatible endpoint
 * by calling GET {baseUrl}/models. Returns success or error info.
 */
export function pingApi(): Promise<PingResponse> {
  const requestId = `ping-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve) => {
    try {
      assertExtensionContext();
    } catch (e) {
      resolve({ type: 'ping:error', requestId, message: (e as Error).message });
      return;
    }
    const listener = (msg: unknown) => {
      const m = msg as PingResponse;
      if (m.requestId !== requestId) return;
      if (m.type === 'ping:ok' || m.type === 'ping:error') {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(m);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    sendRequest({ type: 'ping', requestId });
    // Safety timeout (15s)
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener);
      resolve({ type: 'ping:error', requestId, message: 'Timeout (15s)' });
    }, 15000);
  });
}

/**
 * Sends a batch translate request and resolves with the aligned translations.
 * Rejects on error or timeout. Caller owns a unique requestId.
 */
export function translateBatch(
  req: TranslateBatchRequest,
  timeoutMs = 60000,
): Promise<string[]> {
  assertExtensionContext();
  return new Promise((resolve, reject) => {
    const listener = (msg: unknown) => {
      const m = msg as TranslateBatchResponse;
      if (m.requestId !== req.requestId) return;
      if (m.type === 'translate:batch:done') {
        cleanup();
        resolve(m.translations);
      } else if (m.type === 'translate:batch:error') {
        cleanup();
        reject(new Error(m.message));
      }
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Batch timeout')); }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      chrome.runtime.onMessage.removeListener(listener);
    }
    chrome.runtime.onMessage.addListener(listener);
    sendRequest(req);
  });
}
