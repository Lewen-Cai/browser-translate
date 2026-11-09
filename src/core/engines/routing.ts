import { PROVIDERS, isProviderId, type ProviderId } from '~/core/providers/registry';
import {
  TRANSLATION_SURFACES,
  type EngineRoute,
  type EngineRouting,
  type ProviderConfig,
  type ProvidersConfig,
} from '~/storage/schema';

/**
 * Repair one stored route, returning its input reference when it is sound.
 *
 * Before v0.2.3 a route was a bare provider id; that becomes a route with no
 * model (migrations name the model the provider had). `null` is a surface
 * nobody has chosen an engine for yet, and stays that way.
 */
function normalizeRoute(value: unknown): EngineRoute | null | undefined {
  if (value === null) return null;
  if (isProviderId(value)) return { provider: value };
  if (typeof value !== 'object') return undefined;
  const r = value as { provider?: unknown; model?: unknown };
  if (!isProviderId(r.provider)) return undefined;
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
 * `seed` fills any surface that is missing or names a provider we no longer
 * ship: a provider an old store named for every surface, otherwise nothing —
 * a surface without an engine is not configured, and nothing picks one. Returns its input reference when nothing needs repairing: `loadAppData`
 * decides whether to write storage back by comparing identity, and a fresh
 * object every read would loop through storage.onChanged.
 */
export function normalizeEngineRouting(value: unknown, seed: ProviderId | null = null): EngineRouting {
  const fill = (): EngineRoute | null => (seed && isProviderId(seed) ? { provider: seed } : null);
  if (value === null || typeof value !== 'object') {
    return { selection: fill(), fullPage: fill(), subtitle: fill() };
  }

  const input = value as Partial<Record<string, unknown>>;
  let clean = true;
  const out = {} as EngineRouting;
  for (const surface of TRANSLATION_SURFACES) {
    const stored = input[surface];
    const route = normalizeRoute(stored);
    if (route !== undefined) {
      out[surface] = route;
      if (route !== stored) clean = false;
    } else {
      out[surface] = fill();
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
  return TRANSLATION_SURFACES.some((s) => {
    const route = routing[s];
    return route !== null && PROVIDERS[route.provider].kind === 'llm';
  });
}

/**
 * Whether a model-backed route lacks a usable model: it names none, or names
 * one no longer on the provider's list (the user removed it). Such a route is
 * shown as not configured until the user picks a model again — nothing picks
 * one for them.
 */
export function routeNeedsModel(route: EngineRoute, providers: ProvidersConfig): boolean {
  if (PROVIDERS[route.provider].kind === 'service') return false;
  const models = providers[route.provider]?.models ?? [];
  return !route.model || !models.includes(route.model);
}

/** Why a surface cannot be translated as configured. */
export type RouteProblem = 'unset' | 'provider-off' | 'model-missing';

/**
 * Whether a surface can be translated as the user set it up, and if not, why.
 *
 * There is no fallback: a surface with no engine chosen, one whose provider
 * is switched off — by hand, or because its last model was removed — or one
 * whose model is no longer on its provider's list is not configured, and says
 * so until the user chooses again. Nothing is ever sent to a provider that is switched off, and nothing
 * is sent anywhere the user did not choose.
 */
export function routeProblem(route: EngineRoute | null, providers: ProvidersConfig): RouteProblem | null {
  if (!route) return 'unset';
  if (!providers[route.provider]?.enabled) return 'provider-off';
  if (routeNeedsModel(route, providers)) return 'model-missing';
  return null;
}

/**
 * Forget every surface routed to provider `id` that it can no longer serve —
 * because it was just switched off, or the route's model was just removed.
 * The choice is gone, not suspended: switching the provider back on or adding
 * the model again does not bring it back; the user chooses again. Returns its
 * input reference when nothing changes.
 */
export function releaseRoutes(engines: EngineRouting, providers: ProvidersConfig, id: ProviderId): EngineRouting {
  let out: EngineRouting | null = null;
  for (const surface of TRANSLATION_SURFACES) {
    const route = engines[surface];
    if (route?.provider !== id || !routeProblem(route, providers)) continue;
    out ??= { ...engines };
    out[surface] = null;
  }
  return out ?? engines;
}

/**
 * The provider row a route will actually be served with: the provider's own
 * row, with `model` replaced by the route's model. Everything downstream —
 * readiness, the request, the cache key, the credit line — reads `model`, so
 * resolving it once here keeps them agreeing. Callers check `routeProblem`
 * first; a route without a usable model gets an empty one here, which
 * readiness reports as not configured.
 */
export function routeConfig(route: EngineRoute, providers: ProvidersConfig): ProviderConfig {
  const cfg = providers[route.provider];
  if (PROVIDERS[route.provider].kind === 'service') return cfg;
  const model = routeNeedsModel(route, providers) ? '' : route.model!;
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

/** The key a picker shows as selected: the route exactly as stored. */
export function effectiveRouteKey(route: EngineRoute): string {
  return PROVIDERS[route.provider].kind === 'service' ? route.provider : routeKey(route);
}
