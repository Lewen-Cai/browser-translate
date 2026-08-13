export interface TranslateRequest {
  type: 'translate';
  requestId: string;
  text: string;
  targetLang?: string;           // omit → use global setting
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
}

/**
 * UI contexts (content script, popup, options) report the system
 * prefers-color-scheme state to the background — a service worker has no
 * matchMedia, but needs it to tint the toolbar icon with the same
 * light/dark-variant brand the in-page UI resolves.
 */
export interface SystemDarkReport {
  type: 'theme:dark';
  systemDark: boolean;
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
  | SystemDarkReport;
