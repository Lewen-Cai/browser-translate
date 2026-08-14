import { StorageClient } from '~/storage/client';
import { CacheStore } from '~/storage/cacheStore';
import { OpenAICompatibleProvider } from '~/core/providers/openai';
import { providerConfigFromApi } from '~/core/providers/providerSlots';
import { TranslationProviderError } from '~/core/providers/types';
import { computeCacheKey } from '~/core/cache/key';
import { getMtEngine, isMtEngineId, mtTranslateAll, type MtEngineId } from '~/core/mt';
import { autoSystemPrompt } from '~/core/dictionary/prompt';
import { selectionUserPrompt } from '~/core/prompt/style';
import { batchSystemPrompt, batchUserPrompt } from '~/core/batch/prompt';
import { parseBatchArray } from '~/core/batch/parse';
import { runBatch } from '~/core/batch/runBatch';
import { languageName } from '~/core/language/targets';
import { t as i18nT, resolveLocale } from '~/i18n';
import type { Request, TranslateRequest, TranslateBatchRequest } from '~/messaging/types';

/** Parallel requests the free engines get per batch — they are far cheaper and
 *  faster per call than an LLM, so a page fills in noticeably sooner. */
const MT_BATCH_CONCURRENCY = 4;

export default defineBackground(() => {
  const client = new StorageClient();
  const activeAborts = new Map<string, AbortController>();

  chrome.runtime.onMessage.addListener((msg: Request, _sender, sendResponse) => {
    if (msg.type === 'translate:abort') {
      activeAborts.get(msg.requestId)?.abort();
      sendResponse({ ok: true });
      return false;
    }
    if (msg.type === 'translate') {
      void handleTranslate(msg, _sender, client, activeAborts);
      sendResponse({ ok: true });
      return false;
    }
    if (msg.type === 'translate:batch') {
      void handleTranslateBatch(msg, _sender, client, activeAborts);
      sendResponse({ ok: true });
      return false;
    }
    if (msg.type === 'ping') {
      void handlePing(msg.requestId, client);
      sendResponse({ ok: true });
      return false;
    }
    return false;
  });

  chrome.alarms.create('cache-evict', { periodInMinutes: 60 });
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cache-evict') {
      const data = await client.loadAppData();
      if (data.settings.cacheEnabled) {
        await new CacheStore(client, data.settings.cacheTTLDays).evictExpired();
      }
    }
  });
});

async function handleTranslate(
  msg: TranslateRequest,
  sender: chrome.runtime.MessageSender,
  client: StorageClient,
  activeAborts: Map<string, AbortController>,
): Promise<void> {
  const data = await client.loadAppData();
  const tabId = sender.tab?.id;
  const send = (payload: object) => {
    if (tabId !== undefined) chrome.tabs.sendMessage(tabId, payload).catch(() => {});
    else chrome.runtime.sendMessage(payload).catch(() => {});
  };

  try {
    const api = data.api;
    const engine = data.settings.engine;
    const useMt = isMtEngineId(engine);
    const missingKey = api.providerType === 'cloud' && !api.apiKey;
    if (!useMt && (!api.baseUrl || missingKey || !api.model)) {
      const locale = resolveLocale(
        data.settings.uiLanguage,
        typeof navigator !== 'undefined' ? navigator.language : 'en',
      );
      send({
        type: 'translate:error',
        requestId: msg.requestId,
        message: i18nT('noProfileError', locale),
        kind: 'auth',
      });
      return;
    }
    const targetLang = msg.targetLang ?? data.settings.targetLanguage;

    let cacheKey: string | undefined;
    if (data.settings.cacheEnabled) {
      cacheKey = await computeCacheKey({
        text: msg.text, engine, model: api.model,
        mode: 'selection', targetLang,
      });
      const cached = await new CacheStore(client, data.settings.cacheTTLDays).get(cacheKey);
      if (cached !== undefined) {
        send({ type: 'translate:chunk', requestId: msg.requestId, delta: cached });
        send({ type: 'translate:done', requestId: msg.requestId, full: cached, cached: true });
        return;
      }
    }

    const abortCtl = new AbortController();
    activeAborts.set(msg.requestId, abortCtl);

    let full = '';
    try {
      if (useMt) {
        // No streaming to relay: deliver the finished text as a single chunk,
        // the same shape the cache-hit path above already sends.
        await withRetry(async () => {
          const [translated] = await getMtEngine(engine).translate({
            texts: [msg.text],
            targetLang,
            signal: abortCtl.signal,
          });
          full = translated ?? '';
        });
        if (full) send({ type: 'translate:chunk', requestId: msg.requestId, delta: full });
      } else {
        const provider = new OpenAICompatibleProvider(providerConfigFromApi(api));
        await withRetry(async () => {
          full = '';
          for await (const chunk of provider.translate({
            systemPrompt: autoSystemPrompt(),
            // The model gets the language's English name, not its code: "pt-BR"
          // and "nb" mean nothing to it, while the cache key and the MT engines
          // keep the code, which is the stable identity.
          userPrompt: selectionUserPrompt(msg.text, languageName(targetLang)),
            maxTokens: api.maxTokens,
            stream: true,
            signal: abortCtl.signal,
          })) {
            if (chunk.delta) {
              full += chunk.delta;
              send({ type: 'translate:chunk', requestId: msg.requestId, delta: chunk.delta });
            }
          }
        });
      }
    } finally {
      activeAborts.delete(msg.requestId);
    }

    if (cacheKey && full) {
      await new CacheStore(client, data.settings.cacheTTLDays).set(cacheKey, full);
    }

    send({ type: 'translate:done', requestId: msg.requestId, full, cached: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const kind = e instanceof TranslationProviderError ? e.info.kind : 'unknown';
    send({ type: 'translate:error', requestId: msg.requestId, message, kind });
  }
}

async function handleTranslateBatch(
  msg: TranslateBatchRequest,
  sender: chrome.runtime.MessageSender,
  client: StorageClient,
  activeAborts: Map<string, AbortController>,
): Promise<void> {
  const data = await client.loadAppData();
  const tabId = sender.tab?.id;
  const send = (payload: object) => {
    if (tabId !== undefined) chrome.tabs.sendMessage(tabId, payload).catch(() => {});
    else chrome.runtime.sendMessage(payload).catch(() => {});
  };

  try {
    const api = data.api;
    const engine = data.settings.engine;
    const useMt = isMtEngineId(engine);
    const missingKey = api.providerType === 'cloud' && !api.apiKey;
    if (!useMt && (!api.baseUrl || missingKey || !api.model)) {
      const locale = resolveLocale(
        data.settings.uiLanguage,
        typeof navigator !== 'undefined' ? navigator.language : 'en',
      );
      send({
        type: 'translate:batch:error',
        requestId: msg.requestId,
        message: i18nT('noProfileError', locale),
        kind: 'auth',
      });
      return;
    }
    const targetLang = msg.targetLang ?? data.settings.targetLanguage;

    // One AbortController for the whole batch request: runBatch may call
    // translateOnce many times (the batch call plus per-segment fallback), and
    // they all share this controller — one requestId is one user-cancellable
    // unit, so a single translate:abort cancels the entire page translation.
    const abortCtl = new AbortController();
    activeAborts.set(msg.requestId, abortCtl);

    // One call for a set of segments → { parsed, raw }. The MT engines return an
    // aligned array by construction, so they never need the raw fallback that
    // exists for an LLM answering with something other than a JSON array.
    const translateOnce = useMt
      ? async (segments: string[]) => {
          const parsed = await withRetry(() =>
            mtTranslateAll(
              getMtEngine(engine),
              { texts: segments, targetLang, signal: abortCtl.signal },
              MT_BATCH_CONCURRENCY,
            ),
          );
          return { parsed, raw: '' };
        }
      : (() => {
          const systemPrompt = batchSystemPrompt();
          const provider = new OpenAICompatibleProvider(providerConfigFromApi(api));
          return async (segments: string[]) => {
            let raw = '';
            await withRetry(async () => {
              raw = '';
              for await (const chunk of provider.translate({
                systemPrompt,
                userPrompt: batchUserPrompt(segments, languageName(targetLang)),
                maxTokens: api.maxTokens,
                stream: false,
                signal: abortCtl.signal,
              })) {
                raw += chunk.delta;
              }
            });
            return { parsed: parseBatchArray(raw, segments.length), raw };
          };
        })();

    const cacheStore = new CacheStore(client, data.settings.cacheTTLDays);
    const cacheEnabled = data.settings.cacheEnabled;

    const deps = {
      cacheGet: async (segment: string) => {
        if (!cacheEnabled) return undefined;
        const key = await computeCacheKey({
          text: segment,
          engine,
          model: api.model,
          mode: 'fullpage',
          targetLang,
        });
        return cacheStore.get(key);
      },
      cacheSet: async (segment: string, translated: string) => {
        if (!cacheEnabled || !translated) return;
        const key = await computeCacheKey({
          text: segment,
          engine,
          model: api.model,
          mode: 'fullpage',
          targetLang,
        });
        await cacheStore.set(key, translated);
      },
      translateOnce,
    };

    let translations: string[];
    try {
      translations = await runBatch(msg.segments, deps);
    } finally {
      activeAborts.delete(msg.requestId);
    }

    send({ type: 'translate:batch:done', requestId: msg.requestId, translations });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const kind = e instanceof TranslationProviderError ? e.info.kind : 'unknown';
    send({ type: 'translate:batch:error', requestId: msg.requestId, message, kind });
  }
}

async function handlePing(requestId: string, client: StorageClient): Promise<void> {
  const data = await client.loadAppData();
  const api = data.api;
  const send = (payload: object) => {
    chrome.runtime.sendMessage(payload).catch(() => {});
  };

  const engine = data.settings.engine;
  if (isMtEngineId(engine)) {
    await pingMtEngine(engine, requestId, send);
    return;
  }

  if (!api.baseUrl) {
    send({ type: 'ping:error', requestId, message: 'Base URL is empty' });
    return;
  }
  if (api.providerType === 'cloud' && !api.apiKey) {
    send({ type: 'ping:error', requestId, message: 'API Key is empty' });
    return;
  }

  const endpoint = api.baseUrl.replace(/\/+$/, '') + '/models';
  const ctl = new AbortController();
  const timeout = setTimeout(() => ctl.abort(), 10000);
  const startedAt = Date.now();

  try {
    const headers: Record<string, string> = { ...api.customHeaders };
    if (api.apiKey) {
      headers['Authorization'] = `Bearer ${api.apiKey}`;
    }
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: ctl.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const j = await response.json();
        if (j?.error?.message) detail = String(j.error.message).slice(0, 200);
      } catch { /* not JSON */ }
      send({ type: 'ping:error', requestId, status: response.status, message: detail });
      return;
    }

    let availableModels: string[] = [];
    try {
      const json = await response.json();
      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : [];
      availableModels = list
        .map((m: { id?: string; name?: string }) => m.id ?? m.name ?? '')
        .filter((s: string) => s.length > 0);
    } catch {
      // response was 200 but not parseable as JSON — still considered ok
    }

    let modelInList: boolean | null = null;
    if (api.model) {
      if (availableModels.length > 0) {
        const wanted = api.model.toLowerCase();
        modelInList = availableModels.some((id) => id.toLowerCase() === wanted);
      }
      // else: list empty / unparseable → null (can't determine)
    }

    send({
      type: 'ping:ok',
      requestId,
      latencyMs,
      availableModels,
      modelInList,
      configuredModel: api.model,
    });
  } catch (e) {
    clearTimeout(timeout);
    const msg = (e as Error).name === 'AbortError' ? 'Timeout' : (e as Error).message || 'Network error';
    send({ type: 'ping:error', requestId, message: msg });
  }
}

/**
 * Reachability probe for a free engine: translate one short word and time it.
 * These endpoints have no status page and no /models to ask, and one of them
 * may be unreachable on a given network — an actual round trip is the only
 * honest way to report ready vs offline.
 */
async function pingMtEngine(
  engineId: MtEngineId,
  requestId: string,
  send: (payload: object) => void,
): Promise<void> {
  const engine = getMtEngine(engineId);
  const ctl = new AbortController();
  const timeout = setTimeout(() => ctl.abort(), 8000);
  const startedAt = Date.now();
  try {
    const [translated] = await engine.translate({
      texts: ['hello'],
      targetLang: 'zh-CN',
      sourceLang: 'en',
      signal: ctl.signal,
    });
    clearTimeout(timeout);
    if (!translated) {
      send({ type: 'ping:error', requestId, message: `${engine.label}: empty response` });
      return;
    }
    send({
      type: 'ping:ok',
      requestId,
      latencyMs: Date.now() - startedAt,
      availableModels: [],
      modelInList: true,
      configuredModel: engine.label,
    });
  } catch (e) {
    clearTimeout(timeout);
    const message = (e as Error).name === 'AbortError'
      ? 'Timeout'
      : (e as Error).message || 'Network error';
    send({ type: 'ping:error', requestId, message });
  }
}

async function withRetry<T>(fn: () => Promise<T>, max = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!(e instanceof TranslationProviderError) || !e.info.retryable) throw e;
      const backoff = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}
