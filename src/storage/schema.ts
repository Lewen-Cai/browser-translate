import { MT_ENGINE_IDS, type MtEngineId } from '~/core/mt/types';

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

/**
 * Which backend performs a translation. 'llm' uses the user's configured
 * OpenAI-compatible API; the rest are the free, key-less services in
 * `~/core/mt` (derived from that list so the two can't drift apart).
 */
export const TRANSLATION_ENGINES = ['llm', ...MT_ENGINE_IDS] as const;
export type TranslationEngine = 'llm' | MtEngineId;

export function isTranslationEngine(value: unknown): value is TranslationEngine {
  return typeof value === 'string' && (TRANSLATION_ENGINES as readonly string[]).includes(value);
}

export interface GlobalSettings {
  engine: TranslationEngine;
  targetLanguage: string;
  triggerMode: 'icon' | 'hotkey';
  hotkey: string;
  fullPageHotkey: string;
  cacheEnabled: boolean;
  cacheTTLDays: number;
  theme: 'light' | 'dark' | 'auto';
  themeId: string;                 // built-in id or a customThemes entry id
  customThemes: ThemeDefinition[]; // user-uploaded, deletable
  uiLanguage: 'auto' | 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de';
}

/** The ap-* color tokens a theme must define, per light/dark variant. */
export const THEME_TOKEN_KEYS = [
  'bg', 'surface', 'fg', 'fg-muted', 'fg-subtle', 'border', 'border-strong',
  'brand', 'brand-fg', 'brand-soft', 'danger', 'success',
] as const;
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

/** Values are space-separated RGB triples, e.g. '37 99 235' (rgb(var(--ap-*)) compatible). */
export type ThemePalette = Record<ThemeTokenKey, string>;

export interface ThemeDefinition {
  /** Built-ins: 'cobalt' | 'graphite' | 'sepia' | 'teal'; uploads: 'custom-<uuid>'. */
  id: string;
  /** Display name — locale-invariant. */
  name: string;
  colors: { light: ThemePalette; dark: ThemePalette };
  /** CSS font-family stacks. Applied via --ap-font-sans / --ap-font-mono. */
  fonts: { sans: string; mono: string };
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
