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
  /**
   * Reasoning/thinking control for hybrid models. undefined ≡ 'off' (the
   * default: translation doesn't need billed reasoning tokens). The effort
   * tiers are mapped per provider to its native parameter.
   */
  thinking?: ThinkingSetting;
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

/** Thinking control: off, or one of five effort tiers (mapped per provider). */
export const THINKING_SETTINGS = ['off', 'low', 'medium', 'high', 'xhigh', 'max'] as const;
export type ThinkingSetting = (typeof THINKING_SETTINGS)[number];
export type ThinkingLevel = Exclude<ThinkingSetting, 'off'>;

export function isThinkingSetting(value: unknown): value is ThinkingSetting {
  return typeof value === 'string' && (THINKING_SETTINGS as readonly string[]).includes(value);
}

/** The remembered config for one provider slot. */
export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  thinking?: ThinkingSetting;
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
