import { StorageClient } from '~/storage/client';
import { CacheStore } from '~/storage/cacheStore';
import { OpenAICompatibleProvider } from '~/core/providers/openai';
import { providerConfigFromApi } from '~/core/providers/providerSlots';
import { TranslationProviderError } from '~/core/providers/types';
import { computeCacheKey } from '~/core/cache/key';
import { autoSystemPrompt } from '~/core/dictionary/prompt';
import { selectionUserPrompt } from '~/core/prompt/style';
import { batchSystemPrompt, batchUserPrompt } from '~/core/batch/prompt';
import { parseBatchArray } from '~/core/batch/parse';
import { runBatch } from '~/core/batch/runBatch';
import { t as i18nT, resolveLocale } from '~/i18n';
import { resolveThemeDefinition, themeBrandColors } from '~/core/theme/themes';
import { parseRgbTriple, recolorIconPixels } from '~/core/theme/iconRecolor';
import { resolveEffectiveTheme } from '~/ui/themeResolver';
import type { Request, TranslateRequest, TranslateBatchRequest } from '~/messaging/types';
import type { AppData } from '~/storage/schema';

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
    if (msg.type === 'theme:dark') {
      lastSystemDark = msg.systemDark;
      void chrome.storage.session.set({ systemDark: msg.systemDark }).catch(() => {});
      void client.loadAppData().then((d) => updateActionIcon(d, msg.systemDark)).catch(() => {});
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

  // Keep the toolbar icon on the active theme's brand color. Re-applied on
  // every SW start (setIcon imageData does not persist) and on theme changes.
  void client.loadAppData().then(updateActionIcon).catch(() => {});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !('app:data' in changes)) return;
    void client.loadAppData().then(updateActionIcon).catch(() => {});
  });
});

/** The icon PNGs' baked-in colors (Cobalt light brand background + white glyph). */
const ICON_BASE_BRAND = '37 99 235';
const ICON_BASE_GLYPH = '255 255 255';
const ICON_SIZES = [16, 32, 48, 128] as const;
let lastIconBrand: string | undefined;
let lastSystemDark: boolean | undefined;

/** Last reported prefers-color-scheme state (UI contexts report it — a SW has no matchMedia). */
async function getSystemDark(): Promise<boolean> {
  if (lastSystemDark !== undefined) return lastSystemDark;
  try {
    const stored = await chrome.storage.session.get('systemDark');
    lastSystemDark = stored['systemDark'] === true;
  } catch {
    lastSystemDark = false;
  }
  return lastSystemDark;
}

/**
 * Tint the action icon to the active theme's brand/brand-fg pair, using the
 * SAME variant resolution and color accessor as the in-page trigger icon
 * (resolveEffectiveTheme + themeBrandColors), so the two icons can never
 * disagree. Cosmetic only: any failure leaves the default icon in place.
 */
async function updateActionIcon(data: AppData, systemDark?: boolean): Promise<void> {
  const theme = resolveThemeDefinition(data.settings.themeId, data.settings.customThemes ?? []);
  const isDark = resolveEffectiveTheme(data.settings.theme, systemDark ?? (await getSystemDark()));
  const { brand, brandFg } = themeBrandColors(theme, isDark);
  const cacheKey = `${brand}/${brandFg}`;
  if (cacheKey === lastIconBrand) return;
  try {
    if (brand === ICON_BASE_BRAND && brandFg === ICON_BASE_GLYPH) {
      await chrome.action.setIcon({
        path: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png', 128: 'icon/128.png' },
      });
      lastIconBrand = cacheKey;
      return;
    }
    const from = parseRgbTriple(ICON_BASE_BRAND);
    const to = parseRgbTriple(brand);
    const toGlyph = parseRgbTriple(brandFg);
    const imageData: Record<number, ImageData> = {};
    for (const size of ICON_SIZES) {
      const blob = await (await fetch(chrome.runtime.getURL(`icon/${size}.png`))).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0, size, size);
      const img = ctx.getImageData(0, 0, size, size);
      recolorIconPixels(img.data, from, to, toGlyph);
      imageData[size] = img;
    }
    await chrome.action.setIcon({ imageData });
    lastIconBrand = cacheKey;
  } catch {
    // never let icon cosmetics break the worker
  }
}

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
    const missingKey = api.providerType === 'cloud' && !api.apiKey;
    if (!api.baseUrl || missingKey || !api.model) {
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
        text: msg.text, model: api.model,
        mode: 'selection', targetLang,
      });
      const cached = await new CacheStore(client, data.settings.cacheTTLDays).get(cacheKey);
      if (cached !== undefined) {
        send({ type: 'translate:chunk', requestId: msg.requestId, delta: cached });
        send({ type: 'translate:done', requestId: msg.requestId, full: cached, cached: true });
        return;
      }
    }

    const provider = new OpenAICompatibleProvider(providerConfigFromApi(api));

    const abortCtl = new AbortController();
    activeAborts.set(msg.requestId, abortCtl);

    let full = '';
    try {
      await withRetry(async () => {
        full = '';
        for await (const chunk of provider.translate({
          systemPrompt: autoSystemPrompt(),
          userPrompt: selectionUserPrompt(msg.text, targetLang),
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
    const missingKey = api.providerType === 'cloud' && !api.apiKey;
    if (!api.baseUrl || missingKey || !api.model) {
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
    const systemPrompt = batchSystemPrompt();
    const provider = new OpenAICompatibleProvider(providerConfigFromApi(api));

    // One AbortController for the whole batch request: runBatch may call
    // translateOnce many times (the batch call plus per-segment fallback), and
    // they all share this controller — one requestId is one user-cancellable
    // unit, so a single translate:abort cancels the entire page translation.
    const abortCtl = new AbortController();
    activeAborts.set(msg.requestId, abortCtl);

    // One provider call for a set of segments → { parsed, raw }.
    const translateOnce = async (segments: string[]) => {
      let raw = '';
      await withRetry(async () => {
        raw = '';
        for await (const chunk of provider.translate({
          systemPrompt,
          userPrompt: batchUserPrompt(segments, targetLang),
          maxTokens: api.maxTokens,
          stream: false,
          signal: abortCtl.signal,
        })) {
          raw += chunk.delta;
        }
      });
      return { parsed: parseBatchArray(raw, segments.length), raw };
    };

    const cacheStore = new CacheStore(client, data.settings.cacheTTLDays);
    const cacheEnabled = data.settings.cacheEnabled;

    const deps = {
      cacheGet: async (segment: string) => {
        if (!cacheEnabled) return undefined;
        const key = await computeCacheKey({
          text: segment,
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
