import { PROVIDERS, PROVIDER_IDS, type Capability, type ProviderId } from '~/core/providers/registry';
import type { ProviderOption } from '~/ui/components/ProviderSelect';
import type { EngineRoute, ProvidersConfig } from '~/storage/schema';
import { routeKey } from '~/core/engines/routing';

export interface EngineOptionLabels {
  /** Heading over the free, key-less services. */
  services: string;
  /** Heading over the user's own models. */
  models: string;
}

/**
 * The providers a routing picker may offer: switched on, and able to do the job.
 *
 * `capability` is what keeps a translation service out of a dictionary picker
 * without the picker knowing anything about services — the registry says a
 * service cannot gloss a word, so it simply is not in the list.
 *
 * A provider currently chosen is always included even if it has since been
 * switched off, so the control can show what it is set to rather than appearing
 * blank.
 */
export function engineOptions(
  providers: ProvidersConfig,
  labels: EngineOptionLabels,
  opts: { capability?: Capability; keep?: ProviderId; compact?: boolean } = {},
): ProviderOption[] {
  const capability = opts.capability ?? 'translate';
  return PROVIDER_IDS.filter((id) => {
    if (!PROVIDERS[id].capabilities.includes(capability)) return false;
    return providers[id]?.enabled || id === opts.keep;
  }).map((id) => ({
    value: id,
    label: opts.compact ? PROVIDERS[id].shortLabel ?? PROVIDERS[id].label : PROVIDERS[id].label,
    iconId: id,
    group: PROVIDERS[id].kind === 'service' ? labels.services : labels.models,
  }));
}

/**
 * The (provider, model) choices a routing picker or the card's menu may offer.
 *
 * A service is one option, as before. A model-backed provider becomes one
 * option per model the user keeps for it, so switching a surface from one
 * OpenRouter model to another is a pick, not a retyped name. Option values are
 * route keys (see `routeKey`); `detail` carries the model name for display.
 *
 * A provider with no model yet still appears once, under its own name, so a
 * chosen-but-unfinished provider does not leave the control blank.
 */
export function routeOptions(
  providers: ProvidersConfig,
  labels: EngineOptionLabels,
  opts: { capability?: Capability; keep?: EngineRoute; compact?: boolean } = {},
): RouteOption[] {
  const out: RouteOption[] = [];
  for (const option of engineOptions(providers, labels, {
    capability: opts.capability,
    keep: opts.keep?.provider,
    compact: opts.compact,
  })) {
    const id = option.value as ProviderId;
    const models = PROVIDERS[id].kind === 'llm' ? providers[id]?.models ?? [] : [];
    if (models.length === 0) {
      out.push(option);
      continue;
    }
    for (const model of models) {
      out.push({ ...option, value: routeKey({ provider: id, model }), detail: model });
    }
  }
  return out;
}

export type RouteOption = ProviderOption;
