import type { TranslationSurface } from '~/storage/schema';
import type { ProviderId } from '~/core/providers/registry';

export interface TranslateRequest {
  type: 'translate';
  requestId: string;
  text: string;
  targetLang?: string;           // omit → use global setting
  /**
   * Answer with this provider instead of the one routing chose. The card lets a
   * reader try another one on the spot; it is a property of the request and is
   * never written back to settings, which is what keeps that choice from
   * following them to the next page.
   */
  provider?: ProviderId;
  /**
   * Ignore any cached answer. Asking again is only worth a button if it can
   * actually produce a different answer, and a cache hit would return the same
   * words instantly. The result is still cached.
   */
  refresh?: boolean;
}

export type TranslateResponse =
  | { type: 'translate:chunk'; requestId: string; delta: string }
  | { type: 'translate:done'; requestId: string; full: string; cached: boolean }
  | { type: 'translate:error'; requestId: string; message: string; kind: string };

export interface AbortRequest {
  type: 'translate:abort';
  requestId: string;
}

export interface PingRequest {
  type: 'ping';
  requestId: string;
  /**
   * Which provider to probe. With a provider per surface there is no single
   * "the API" to infer, so the caller says — each row on the Providers page
   * reports on itself.
   */
  provider: ProviderId;
}


export type PingResponse =
  | {
      type: 'ping:ok';
      requestId: string;
      latencyMs: number;
      availableModels: string[];      // empty if provider didn't return a list we could parse
      modelInList: boolean | null;    // null if we couldn't determine (no list or no api.model set)
      configuredModel: string;        // echo of api.model for client-side reference
    }
  | { type: 'ping:error'; requestId: string; status?: number; message: string };

export interface TranslateBatchRequest {
  type: 'translate:batch';
  requestId: string;
  segments: string[];
  targetLang?: string; // omit → use global setting
  /**
   * Which caller this is. Both full-page translation and video subtitles batch
   * their segments through here, and the two route to their own engines, so the
   * request has to say which one it is — the shape alone can't tell them apart.
   */
  surface: Extract<TranslationSurface, 'fullPage' | 'subtitle'>;
}

export type TranslateBatchResponse =
  | { type: 'translate:batch:done'; requestId: string; translations: string[] }
  | { type: 'translate:batch:error'; requestId: string; message: string; kind: string };

/** Popup → active tab content script: control full-page translation. */
export type PageControlRequest =
  | { type: 'page:toggle' }
  | { type: 'page:query' };

/** Content script → popup reply. */
export interface PageStateResponse {
  translated: boolean;
}

export type Request =
  | TranslateRequest
  | TranslateBatchRequest
  | AbortRequest
  | PingRequest
 ;
