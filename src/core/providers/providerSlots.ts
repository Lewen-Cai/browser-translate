import { CLOUD_PRESETS, thinkingPatch } from './presets';
import type { OpenAIProviderConfig } from './openai';
import type { ApiSettings, ProviderConfig, ProviderSlot } from '~/storage/schema';

export function activeSlot(api: ApiSettings): ProviderSlot {
  return api.providerType === 'local' ? 'local' : api.cloudProvider;
}

/**
 * Build the provider constructor config from the live ApiSettings.
 * thinking defaults to 'off'. When the active slot has known control params,
 * they are injected into the request body via extraBody — the disable param
 * for 'off', or the provider-mapped effort param for a tier. Slots with no
 * safe param send nothing (the model's own default applies).
 */
export function providerConfigFromApi(api: ApiSettings): OpenAIProviderConfig {
  const patch = thinkingPatch(activeSlot(api), api.thinking ?? 'off');
  return {
    baseUrl: api.baseUrl,
    apiKey: api.apiKey,
    model: api.model,
    customHeaders: api.customHeaders,
    ...(patch && { extraBody: patch }),
  };
}

export function defaultConfigForSlot(slot: ProviderSlot): ProviderConfig {
  const baseUrl = slot === 'local' ? '' : (CLOUD_PRESETS[slot].endpoints[0]?.baseUrl ?? '');
  return { baseUrl, apiKey: '', model: '' };
}

/** Switch the active provider to `slot`, restoring its remembered config (or defaults). */
export function applySlot(api: ApiSettings, slot: ProviderSlot): ApiSettings {
  const cfg = api.savedConfigs?.[slot] ?? defaultConfigForSlot(slot);
  return {
    ...api,
    providerType: slot === 'local' ? 'local' : 'cloud',
    // Preserve the last cloud provider while in local, so Local -> Cloud returns to it.
    cloudProvider: slot === 'local' ? api.cloudProvider : slot,
    baseUrl: cfg.baseUrl,
    apiKey: cfg.apiKey,
    model: cfg.model,
    thinking: cfg.thinking,   // undefined ≡ 'off' — clears when the slot never set it
  };
}

/** Stamp the current active fields into the active slot's remembered config. */
export function rememberActive(api: ApiSettings): ApiSettings {
  const slot = activeSlot(api);
  return {
    ...api,
    savedConfigs: {
      ...api.savedConfigs,
      [slot]: {
        baseUrl: api.baseUrl,
        apiKey: api.apiKey,
        model: api.model,
        ...(api.thinking !== undefined && { thinking: api.thinking }),
      },
    },
  };
}
