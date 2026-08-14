import type { ProviderId } from '~/core/providers/registry';
import type { SubtitlePosition, SubtitleStyle } from '~/core/subtitles/style';

export const APP_DATA_VERSION = 1 as const;

export interface AppData {
  version: typeof APP_DATA_VERSION;
  providers: ProvidersConfig;
  settings: GlobalSettings;
}

/**
 * What we hold for one provider.
 *
 * Every provider in the registry gets a row, configured or not, so that turning
 * one on is an edit to an existing row rather than a creation. The free
 * services leave the credential fields empty — they have none.
 */
export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  /**
   * Reasoning control. undefined ≡ 'off' — translation does not need billed
   * reasoning tokens. Mapped per provider to its own parameter.
   */
  thinking?: ThinkingSetting;
  /** Whether routing may pick it. */
  enabled: boolean;
}

export type ProvidersConfig = Record<ProviderId, ProviderConfig>;

/** Thinking control: off, or one of five effort tiers (mapped per provider). */
export const THINKING_SETTINGS = ['off', 'low', 'medium', 'high', 'xhigh', 'max'] as const;
export type ThinkingSetting = (typeof THINKING_SETTINGS)[number];
export type ThinkingLevel = Exclude<ThinkingSetting, 'off'>;

export function isThinkingSetting(value: unknown): value is ThinkingSetting {
  return typeof value === 'string' && (THINKING_SETTINGS as readonly string[]).includes(value);
}

/**
 * The three places a translation happens. They are worth routing separately:
 * a free service is fast and costs nothing, which suits a whole page or an
 * hour of subtitles, while a model reads context and is the only kind of
 * provider that can answer a single word with a dictionary entry.
 */
export const TRANSLATION_SURFACES = ['selection', 'fullPage', 'subtitle'] as const;
export type TranslationSurface = (typeof TRANSLATION_SURFACES)[number];

/** Which provider serves each surface, by registry id. */
export type EngineRouting = Record<TranslationSurface, ProviderId>;

export interface GlobalSettings {
  engines: EngineRouting;
  targetLanguage: string;
  triggerMode: 'icon' | 'hotkey';
  hotkey: string;
  fullPageHotkey: string;
  cacheEnabled: boolean;
  cacheTTLDays: number;
  /** Where the on-video subtitle block sits, relative to a player edge. */
  subtitlePosition: SubtitlePosition;
  /** How the on-video subtitles are drawn. */
  subtitleStyle: SubtitleStyle;
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
