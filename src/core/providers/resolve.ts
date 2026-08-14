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

/**
 * Which provider actually answers a request that asked for one by name.
 *
 * The asking side is the card, whose menu only offers providers that are
 * switched on — but the card outlives the settings page, so by the time the
 * request arrives the named provider may have been switched off or removed from
 * a since-shrunk registry. Either way the honest answer is the one routing would
 * have chosen anyway, rather than an error about a choice the reader has already
 * moved on from.
 */
export function resolveRequestedProvider(
  requested: string | undefined,
  routed: ProviderId,
  providers: ProvidersConfig,
): ProviderId {
  if (!requested || !(requested in PROVIDERS)) return routed;
  const id = requested as ProviderId;
  if (id === routed) return routed;
  return providers[id]?.enabled ? id : routed;
}

/** Providers the user has switched on, in registry order. */
export function enabledProviders(providers: ProvidersConfig): ProviderId[] {
  return (Object.keys(PROVIDERS) as ProviderId[]).filter((id) => providers[id]?.enabled);
}
