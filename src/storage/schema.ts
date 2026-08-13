export const APP_DATA_VERSION = 1 as const;

export interface AppData {
  version: typeof APP_DATA_VERSION;
  api: ApiSettings;
  settings: GlobalSettings;
}

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  customHeaders?: Record<string, string>;
  providerType: 'cloud' | 'local';
  cloudProvider:
    | 'openai'
    | 'deepseek'
    | 'moonshot'
    | 'zhipu'
    | 'dashscope'
    | 'siliconflow'
    | 'openrouter'
    | 'mistral'
    | 'custom';
  savedConfigs?: Partial<Record<ProviderSlot, ProviderConfig>>;
}

/** Identity of a remembered config bucket. */
export type ProviderSlot = ApiSettings['cloudProvider'] | 'local';

/** The remembered config for one provider slot. */
export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface GlobalSettings {
  targetLanguage: string;
  triggerMode: 'icon' | 'hotkey';
  hotkey: string;
  fullPageHotkey: string;
  cacheEnabled: boolean;
  cacheTTLDays: number;
  theme: 'light' | 'dark' | 'auto';
  uiLanguage: 'auto' | 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de';
}

export interface CacheMeta {
  key: string;
  storageKey: string;
  createdAt: number;
  hitCount: number;
}

export interface CacheEntry {
  translated: string;
}
