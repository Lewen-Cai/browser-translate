import { PROVIDERS, thinkingPatch, type ProviderId } from './registry';
import type { OpenAIProviderConfig } from './openai';
import type { ProviderConfig, ProvidersConfig } from '~/storage/schema';

/**
 * Build the request config for a model-backed provider.
 *
 * The registry supplies two things the stored config cannot: the headers the
 * endpoint requires before a browser may talk to it at all, and how this vendor
 * spells thinking control. Both are properties of the vendor, not of what the
 * user typed, so neither is stored.
 */
export function llmRequestConfig(id: ProviderId, cfg: ProviderConfig): OpenAIProviderConfig {
  const def = PROVIDERS[id];
  const patch = thinkingPatch(id, cfg.thinking ?? 'off');
  return {
    baseUrl: cfg.baseUrl,
    apiKey: cfg.apiKey,
    model: cfg.model,
    ...(def.requiredHeaders && { customHeaders: { ...def.requiredHeaders } }),
    ...(patch && { extraBody: patch }),
  };
}

/**
 * True when a provider has everything it needs to be used. A free service is
 * always ready; a model needs an endpoint and a model name, and a key as well
 * unless it is self-hosted.
 */
export function isProviderReady(id: ProviderId, cfg: ProviderConfig | undefined): boolean {
  const def = PROVIDERS[id];
  if (def.kind === 'service') return true;
  if (!cfg) return false;
  if (!cfg.baseUrl || !cfg.model) return false;
  return !def.needsKey || Boolean(cfg.apiKey);
}

/** Providers the user has switched on, in registry order. */
export function enabledProviders(providers: ProvidersConfig): ProviderId[] {
  return (Object.keys(PROVIDERS) as ProviderId[]).filter((id) => providers[id]?.enabled);
}
