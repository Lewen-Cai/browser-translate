import { PROVIDERS, isProviderId, type ProviderId } from '~/core/providers/registry';
import { effectiveModel } from '~/core/providers/models';
import {
  TRANSLATION_SURFACES,
  type EngineRoute,
  type EngineRouting,
  type ProviderConfig,
  type ProvidersConfig,
} from '~/storage/schema';

/**
 * What a store with nothing configured translates with: a free service, so a
 * fresh install works before the user has entered anything.
 */
export const DEFAULT_PROVIDER: ProviderId = 'microsoft';

/**
 * Repair one stored route, returning its input reference when it is sound.
 *
 * Before v0.2.3 a route was a bare provider id; that becomes a route with no
 * model, which means "the provider's default" — exactly what it meant then.
 */
function normalizeRoute(value: unknown): EngineRoute | null {
  if (isProviderId(value)) return { provider: value };
  if (value === null || typeof value !== 'object') return null;
  const r = value as { provider?: unknown; model?: unknown };
  if (!isProviderId(r.provider)) return null;
  const model = typeof r.model === 'string' ? r.model.trim() : '';
  // A service has no models, so a model on its route could only be stale.
  const keepModel = model !== '' && PROVIDERS[r.provider].kind === 'llm';
  const sound =
    Object.keys(r).length === (r.model === undefined ? 1 : 2) &&
    (r.model === undefined || (keepModel && r.model === model));
  if (sound) return value as EngineRoute;
  return keepModel ? { provider: r.provider, model } : { provider: r.provider };
}

/**
 * Repair a stored routing table.
 *
 * `fallback` fills any surface that is missing or names a provider we no longer
 * ship. Returns its input reference when nothing needs repairing: `loadAppData`
 * decides whether to write storage back by comparing identity, and a fresh
 * object every read would loop through storage.onChanged.
 */
export function normalizeEngineRouting(value: unknown, fallback: ProviderId): EngineRouting {
  const seed: ProviderId = isProviderId(fallback) ? fallback : DEFAULT_PROVIDER;
  if (value === null || typeof value !== 'object') {
    return { selection: { provider: seed }, fullPage: { provider: seed }, subtitle: { provider: seed } };
  }

  const input = value as Partial<Record<string, unknown>>;
  let clean = true;
  const out = {} as EngineRouting;
  for (const surface of TRANSLATION_SURFACES) {
    const stored = input[surface];
    const route = normalizeRoute(stored);
    if (route) {
      out[surface] = route;
      if (route !== stored) clean = false;
    } else {
      out[surface] = { provider: seed };
      clean = false;
    }
  }
  // An object carrying extra keys is not clean either — it would keep whatever
  // a removed surface left behind for the life of the store.
  if (clean && Object.keys(input).length !== TRANSLATION_SURFACES.length) clean = false;
  return clean ? (value as EngineRouting) : out;
}

/** True when any surface translates through a model rather than a free service. */
export function usesModel(routing: EngineRouting): boolean {
  return TRANSLATION_SURFACES.some((s) => PROVIDERS[routing[s].provider].kind === 'llm');
}

/**
 * The provider row a route will actually be served with: the provider's own
 * row, with `model` replaced by the model the route uses. Everything downstream
 * — readiness, the request, the cache key, the credit line — reads `model`, so
 * resolving it once here is what keeps them agreeing with each other.
 */
export function routeConfig(route: EngineRoute, providers: ProvidersConfig): ProviderConfig {
  const cfg = providers[route.provider];
  if (PROVIDERS[route.provider].kind === 'service') return cfg;
  const model = effectiveModel(cfg, route.model);
  return model === cfg.model ? cfg : { ...cfg, model };
}

/**
 * One string per (provider, model) choice, for the pickers, whose options are
 * keyed by a string. Provider ids never contain `|`, so splitting on the first
 * one recovers the model even when the model name has a `|` of its own.
 */
export function routeKey(route: EngineRoute): string {
  return route.model ? `${route.provider}|${route.model}` : route.provider;
}

export function parseRouteKey(key: string): EngineRoute | null {
  const bar = key.indexOf('|');
  const provider = bar === -1 ? key : key.slice(0, bar);
  if (!isProviderId(provider)) return null;
  const model = bar === -1 ? '' : key.slice(bar + 1);
  return model ? { provider, model } : { provider };
}

/**
 * The key a picker should show as selected for a route: the model it really
 * uses, so a route with no model — or a removed one — lights up the default
 * rather than nothing.
 */
export function effectiveRouteKey(route: EngineRoute, providers: ProvidersConfig): string {
  if (PROVIDERS[route.provider].kind === 'service') return route.provider;
  const cfg = providers[route.provider];
  return routeKey({ provider: route.provider, model: effectiveModel(cfg, route.model) || undefined });
}
