import { APP_DATA_VERSION, isThinkingSetting, isTranslationEngine, type AppData } from './schema';
import type { ProviderConfig, ProviderSlot } from './schema';
import { inferCloudProvider, isCloudProvider } from '~/core/providers/presets';
import { activeSlot } from '~/core/providers/providerSlots';
import { DEFAULT_THEME_ID, isBuiltInThemeId, isValidThemeDefinition } from '~/core/theme/themes';

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
  data = stripLegacyTemplateFields(data);
  data = fillApiProviderDefaults(data);
  data = normalizeThinking(data);
  data = seedSavedConfigs(data);
  data = fillSettingsDefaults(data);
  return data;
}

/** Drop an invalid api.thinking value (absent ≡ 'off'). Idempotent. */
function normalizeThinking(data: AppData): AppData {
  const value = (data.api as { thinking?: unknown }).thinking;
  if (value === undefined || isThinkingSetting(value)) return data;
  const { thinking: _invalid, ...api } = data.api as AppData['api'] & { thinking?: unknown };
  return { ...data, api };
}

/**
 * Strip keys left behind by the removed prompt-template system (< v0.1.8):
 * AppData.promptTemplates and api.promptTemplateId. Idempotent.
 */
function stripLegacyTemplateFields(data: AppData): AppData {
  const d = data as AppData & {
    promptTemplates?: unknown;
    api: AppData['api'] & { promptTemplateId?: unknown };
  };
  const hasTemplates = 'promptTemplates' in d;
  const hasRef = 'promptTemplateId' in d.api;
  if (!hasTemplates && !hasRef) return data;
  const { promptTemplates: _templates, ...rest } = d;
  const { promptTemplateId: _ref, ...api } = d.api;
  return { ...rest, api };
}

function fillSettingsDefaults(data: AppData): AppData {
  const s = data.settings;
  const fullPageHotkey = typeof s.fullPageHotkey === 'string' ? s.fullPageHotkey : 'Alt+A';
  // Stores written before engines existed keep translating through their API;
  // only a store with nothing configured falls to the free default.
  const engine = isTranslationEngine(s.engine)
    ? s.engine
    : data.api.baseUrl && data.api.model
      ? 'llm'
      : 'microsoft';
  const rawCustom = Array.isArray(s.customThemes) ? s.customThemes : [];
  const customThemes = rawCustom.filter(isValidThemeDefinition);
  const themeIdCandidate = typeof s.themeId === 'string' ? s.themeId : DEFAULT_THEME_ID;
  const themeId =
    isBuiltInThemeId(themeIdCandidate) || customThemes.some((t) => t.id === themeIdCandidate)
      ? themeIdCandidate
      : DEFAULT_THEME_ID;

  const unchanged =
    fullPageHotkey === s.fullPageHotkey &&
    themeId === s.themeId &&
    engine === s.engine &&
    customThemes.length === rawCustom.length &&
    s.customThemes === rawCustom;
  if (unchanged) return data;

  return { ...data, settings: { ...s, engine, fullPageHotkey, themeId, customThemes } };
}

function fillApiProviderDefaults(data: AppData): AppData {
  const api = data.api;
  const providerTypeValid = api.providerType === 'cloud' || api.providerType === 'local';
  const cloudProviderValid = isCloudProvider(api.cloudProvider ?? '');
  if (providerTypeValid && cloudProviderValid) return data;
  return {
    ...data,
    api: {
      ...api,
      providerType: api.providerType === 'local' ? 'local' : 'cloud',
      cloudProvider: isCloudProvider(api.cloudProvider ?? '')
        ? api.cloudProvider
        : inferCloudProvider(api.baseUrl),
    },
  };
}

function seedSavedConfigs(data: AppData): AppData {
  const api = data.api;
  const raw = api.savedConfigs && typeof api.savedConfigs === 'object' ? api.savedConfigs : {};
  const clean: Partial<Record<ProviderSlot, ProviderConfig>> = {};
  for (const [slot, cfg] of Object.entries(raw)) {
    if (cfg && typeof cfg.baseUrl === 'string' && typeof cfg.apiKey === 'string' && typeof cfg.model === 'string') {
      clean[slot as ProviderSlot] = {
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        model: cfg.model,
        // Preserve a valid thinking value; anything else is dropped (≡ 'off').
        ...(isThinkingSetting(cfg.thinking) && { thinking: cfg.thinking }),
      };
    }
  }
  const slot = activeSlot(api);
  if (!(slot in clean)) {
    clean[slot] = { baseUrl: api.baseUrl, apiKey: api.apiKey, model: api.model };
  }
  if (JSON.stringify(api.savedConfigs ?? null) === JSON.stringify(clean)) return data;
  return { ...data, api: { ...api, savedConfigs: clean } };
}
