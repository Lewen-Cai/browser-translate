import { PROVIDERS, isProviderId, type ProviderId } from '~/core/providers/registry';
import { TRANSLATION_SURFACES, type EngineRouting } from '~/storage/schema';

/**
 * What a store with nothing configured translates with: a free service, so a
 * fresh install works before the user has entered anything.
 */
export const DEFAULT_PROVIDER: ProviderId = 'microsoft';

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
    return { selection: seed, fullPage: seed, subtitle: seed };
  }

  const input = value as Partial<Record<string, unknown>>;
  let clean = true;
  const out = {} as EngineRouting;
  for (const surface of TRANSLATION_SURFACES) {
    const stored = input[surface];
    if (isProviderId(stored)) {
      out[surface] = stored;
    } else {
      out[surface] = seed;
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
  return TRANSLATION_SURFACES.some((s) => PROVIDERS[routing[s]].kind === 'llm');
}
