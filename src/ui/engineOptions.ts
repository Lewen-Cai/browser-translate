import { PROVIDERS, PROVIDER_IDS, type Capability, type ProviderId } from '~/core/providers/registry';
import type { ProviderOption } from '~/ui/components/ProviderSelect';
import type { ProvidersConfig } from '~/storage/schema';

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
  opts: { capability?: Capability; keep?: ProviderId } = {},
): ProviderOption[] {
  const capability = opts.capability ?? 'translate';
  return PROVIDER_IDS.filter((id) => {
    if (!PROVIDERS[id].capabilities.includes(capability)) return false;
    return providers[id]?.enabled || id === opts.keep;
  }).map((id) => ({
    value: id,
    label: PROVIDERS[id].label,
    iconId: id,
    group: PROVIDERS[id].kind === 'service' ? labels.services : labels.models,
  }));
}
