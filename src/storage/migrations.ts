import { APP_DATA_VERSION, isThinkingSetting, type AppData } from './schema';
import type { GlobalSettings, ProviderConfig, ProvidersConfig } from './schema';
import { createDefaultProviders, defaultProviderConfig } from './defaults';
import { PROVIDER_IDS, isProviderId, type ProviderId } from '~/core/providers/registry';
import { isProviderReady } from '~/core/providers/resolve';
import { DEFAULT_PROVIDER, normalizeEngineRouting } from '~/core/engines/routing';
import { DEFAULT_TARGET_LANGUAGE, isTargetLanguage } from '~/core/language/targets';
import { normalizeSubtitlePosition, normalizeSubtitleStyle } from '~/core/subtitles/style';

/**
 * Integrity repairs applied to AppData on every load.
 * No version migration in v1 (this is the initial shape).
 * Every pass MUST return its input reference when nothing changes —
 * loadAppData uses identity to decide whether to write storage back.
 */
export function migrateAppData(input: AppData): AppData {
  if (typeof input.version !== 'number' || input.version > APP_DATA_VERSION) {
    throw new Error(`Unsupported AppData version: ${input.version}`);
  }

  let data = input;
  data = stripLegacyFields(data);
  data = adoptProviders(data);
  data = fillSettingsDefaults(data);
  return data;
}

/** Settings keys replaced by `subtitlePosition` / `subtitleStyle` in v0.1.9. */
const LEGACY_SUBTITLE_KEYS = [
  'subtitleOffsetPct',
  'subtitleFontScale',
  'subtitleBackgroundOpacity',
  'subtitleTranslationOnly',
] as const;

/**
 * Strip keys left behind by removed features: the prompt-template system
 * (< v0.1.8), the theme system and the flat subtitle settings (< v0.1.9).
 * Idempotent.
 */
function stripLegacyFields(data: AppData): AppData {
  const d = data as AppData & {
    promptTemplates?: unknown;
    settings: GlobalSettings & { themeId?: unknown; customThemes?: unknown };
  };
  const hasTemplates = 'promptTemplates' in d;
  const hasThemeFields = 'themeId' in d.settings || 'customThemes' in d.settings;
  const staleSubtitleKeys = LEGACY_SUBTITLE_KEYS.filter((k) => k in d.settings);
  if (!hasTemplates && !hasThemeFields && staleSubtitleKeys.length === 0) return data;
  const { promptTemplates: _templates, ...rest } = d;
  const { themeId: _themeId, customThemes: _customThemes, ...settings } = d.settings;
  for (const key of staleSubtitleKeys) delete (settings as Record<string, unknown>)[key];
  return { ...rest, settings };
}

/** The single `api` object a store held before v0.2.0. */
interface LegacyApi {
  baseUrl?: unknown;
  apiKey?: unknown;
  model?: unknown;
  thinking?: unknown;
  providerType?: unknown;
  cloudProvider?: unknown;
  savedConfigs?: unknown;
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/** Which provider a pre-v0.2.0 store was actively translating through. */
function legacyActiveProvider(api: LegacyApi): ProviderId {
  if (api.providerType === 'local') return 'local';
  return isProviderId(api.cloudProvider) ? api.cloudProvider : 'custom';
}

/** Repair one row, returning the same reference when it is already sound. */
function normalizeRow(id: ProviderId, value: unknown): ProviderConfig {
  const fallback = defaultProviderConfig(id);
  if (value === null || typeof value !== 'object') return fallback;
  const row = value as Partial<ProviderConfig> & { thinking?: unknown };
  const thinkingOk = row.thinking === undefined || isThinkingSetting(row.thinking);
  const clean =
    typeof row.baseUrl === 'string' &&
    typeof row.apiKey === 'string' &&
    typeof row.model === 'string' &&
    typeof row.enabled === 'boolean' &&
    thinkingOk &&
    Object.keys(row).length === (row.thinking === undefined ? 4 : 5);
  if (clean) return value as ProviderConfig;
  return {
    baseUrl: str(row.baseUrl, fallback.baseUrl),
    apiKey: str(row.apiKey, ''),
    model: str(row.model, ''),
    ...(isThinkingSetting(row.thinking) && { thinking: row.thinking }),
    enabled: typeof row.enabled === 'boolean' ? row.enabled : fallback.enabled,
  };
}

/**
 * Build the provider table.
 *
 * Before v0.2.0 a store held one active `api` plus a bag of remembered
 * per-vendor configs. Those remembered configs become rows directly, the active
 * one wins for its own row, and it is switched on only if it was actually
 * usable — enabling a half-filled row would put a provider into routing that
 * cannot answer. The free services were always available, so they stay on.
 */
function providersFromLegacy(api: LegacyApi): ProvidersConfig {
  const out = createDefaultProviders();

  const saved = api.savedConfigs;
  if (saved && typeof saved === 'object') {
    for (const [slot, cfg] of Object.entries(saved as Record<string, unknown>)) {
      if (!isProviderId(slot) || !cfg || typeof cfg !== 'object') continue;
      const c = cfg as Record<string, unknown>;
      out[slot] = {
        baseUrl: str(c.baseUrl, out[slot].baseUrl),
        apiKey: str(c.apiKey, ''),
        model: str(c.model, ''),
        ...(isThinkingSetting(c.thinking) && { thinking: c.thinking }),
        enabled: false,
      };
    }
  }

  const active = legacyActiveProvider(api);
  const live: ProviderConfig = {
    baseUrl: str(api.baseUrl, out[active].baseUrl),
    apiKey: str(api.apiKey, out[active].apiKey),
    model: str(api.model, out[active].model),
    ...(isThinkingSetting(api.thinking) && { thinking: api.thinking }),
    enabled: false,
  };
  out[active] = { ...live, enabled: isProviderReady(active, live) };
  return out;
}

function adoptProviders(data: AppData): AppData {
  const d = data as AppData & { api?: LegacyApi };
  const hasLegacyApi = 'api' in d;

  if (!hasLegacyApi) {
    const stored = data.providers as unknown;
    if (stored && typeof stored === 'object') {
      let clean = Object.keys(stored).length === PROVIDER_IDS.length;
      const out = {} as ProvidersConfig;
      for (const id of PROVIDER_IDS) {
        const row = normalizeRow(id, (stored as Record<string, unknown>)[id]);
        if (row !== (stored as Record<string, unknown>)[id]) clean = false;
        out[id] = row;
      }
      return clean ? data : { ...data, providers: out };
    }
    return { ...data, providers: createDefaultProviders() };
  }

  const { api, ...rest } = d;
  const providers = providersFromLegacy(api ?? {});
  const active = legacyActiveProvider(api ?? {});

  // Routing spoke of "the model" abstractly; now it names one. Whatever the
  // store was actually using is the only honest answer.
  const settings = data.settings as GlobalSettings & { engine?: unknown; engines?: unknown };
  const remap = (value: unknown) => (value === 'llm' ? active : value);
  const engines =
    settings.engines && typeof settings.engines === 'object'
      ? Object.fromEntries(
          Object.entries(settings.engines as Record<string, unknown>).map(([k, v]) => [k, remap(v)]),
        )
      : remap(settings.engine);

  return { ...rest, providers, settings: { ...settings, engines } as GlobalSettings };
}

function fillSettingsDefaults(data: AppData): AppData {
  const s = data.settings as GlobalSettings & { engine?: unknown };
  const fullPageHotkey = typeof s.fullPageHotkey === 'string' ? s.fullPageHotkey : 'Alt+A';
  // A store with nothing configured falls to the free default; one that already
  // named a provider for everything keeps it.
  const seed: ProviderId = isProviderId(s.engines) ? s.engines : DEFAULT_PROVIDER;
  const engines = normalizeEngineRouting(s.engines, seed);
  const subtitlePosition = normalizeSubtitlePosition(s.subtitlePosition);
  const subtitleStyle = normalizeSubtitleStyle(s.subtitleStyle);
  // A target language we no longer offer would be sent to the providers verbatim
  // and answered with something arbitrary, so it falls back rather than passes
  // through. Every language the picker has ever offered is still on the list.
  const targetLanguage = isTargetLanguage(s.targetLanguage)
    ? s.targetLanguage
    : DEFAULT_TARGET_LANGUAGE;
  const unchanged =
    fullPageHotkey === s.fullPageHotkey &&
    engines === s.engines &&
    targetLanguage === s.targetLanguage &&
    subtitlePosition === s.subtitlePosition &&
    subtitleStyle === s.subtitleStyle &&
    !('engine' in s);
  if (unchanged) return data;

  // `engine` is dropped here rather than in stripLegacyFields: that pass runs
  // first, and adoptProviders still needs to read the old value.
  const { engine: _legacy, ...rest } = s;
  return {
    ...data,
    settings: { ...rest, engines, fullPageHotkey, targetLanguage, subtitlePosition, subtitleStyle },
  };
}
