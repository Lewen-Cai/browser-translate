import { APP_DATA_VERSION, type AppData } from './schema';
import type { ProviderConfig, ProviderSlot } from './schema';
import { inferCloudProvider, isCloudProvider } from '~/core/providers/presets';
import { activeSlot } from '~/core/providers/providerSlots';

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
  data = seedSavedConfigs(data);
  data = fillSettingsDefaults(data);
  return data;
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
  if (typeof data.settings.fullPageHotkey === 'string') return data;
  return { ...data, settings: { ...data.settings, fullPageHotkey: 'Alt+A' } };
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
      clean[slot as ProviderSlot] = { baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model };
    }
  }
  const slot = activeSlot(api);
  if (!(slot in clean)) {
    clean[slot] = { baseUrl: api.baseUrl, apiKey: api.apiKey, model: api.model };
  }
  if (JSON.stringify(api.savedConfigs ?? null) === JSON.stringify(clean)) return data;
  return { ...data, api: { ...api, savedConfigs: clean } };
}
