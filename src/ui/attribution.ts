import { PROVIDERS, type ProviderId } from '~/core/providers/registry';
import type { ProviderConfig } from '~/storage/schema';

export interface TranslationAttribution {
  /** Which mark to draw beside the label. */
  iconId: ProviderId;
  /** Brand or model name — locale-invariant, so never an i18n string. */
  label: string;
}

/**
 * Who produced a translation, for the credit line on the result card.
 *
 * With a model the model name is the useful part (that is what the reader
 * chose and what explains the wording); with a free service there is no model,
 * so the service's own name is the answer. A self-hosted runtime and a
 * hand-entered endpoint have no brand worth naming either, so they fall back to
 * the model too.
 */
export function translationAttribution(
  id: ProviderId,
  cfg: ProviderConfig | undefined,
): TranslationAttribution {
  const def = PROVIDERS[id];
  if (def.kind === 'service') return { iconId: id, label: def.label };
  const brand = id === 'local' || id === 'custom' ? '' : def.label;
  return { iconId: id, label: cfg?.model || brand };
}
