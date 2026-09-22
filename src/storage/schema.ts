import type { ProviderId } from '~/core/providers/registry';
import type { ThinkingDialect } from '~/core/providers/thinking';
import type { SubtitlePosition, SubtitleStyle } from '~/core/subtitles/style';
import type { CardSize } from '~/core/card/size';
import type { PromptSettings } from '~/core/prompt/templates';
import type { Locale } from '~/i18n/localeInfo';

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
  /**
   * Which request-body fields carry that control, for a provider the registry
   * has no answer for — a custom endpoint, or a local runtime whose loaded
   * model decides. Ignored where the registry does know, and undefined ≡ none.
   */
  thinkingDialect?: ThinkingDialect;
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
  prompts: PromptSettings;
  triggerMode: 'icon' | 'hotkey';
  hotkey: string;
  fullPageHotkey: string;
  cacheEnabled: boolean;
  cacheTTLDays: number;
  /**
   * How big the selection card is. Fixed so an arriving answer moves nothing,
   * and settable because how much room that answer deserves depends on the
   * screen it is read on.
   */
  cardSize: CardSize;
  /** Where the on-video subtitle block sits, relative to a player edge. */
  subtitlePosition: SubtitlePosition;
  /** How the on-video subtitles are drawn. */
  subtitleStyle: SubtitleStyle;
  theme: 'light' | 'dark' | 'auto';
  uiLanguage: 'auto' | Locale;
}

/**
 * What the last update check found — written only when somebody presses the
 * button, and read when the settings page opens so the answer survives closing
 * it. Deliberately outside `AppData`: this is something we observed, not
 * something the user set, and `app:data` is watched by every content script, so
 * writing a check result there would rebuild the selection watchers on every
 * tab and close any card that happened to be open.
 */
export interface UpdateState {
  /** Epoch ms of the last completed check, 0 if there has never been one. */
  lastCheckedAt: number;
  /** The newest tag seen, or null if no check has succeeded. */
  latestTag: string | null;
  /** Where that release is published. */
  releaseUrl: string | null;
  /** The package attached to it, if there was one. */
  downloadUrl: string | null;
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
