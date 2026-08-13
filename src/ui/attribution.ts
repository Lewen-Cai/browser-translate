import { MT_ENGINES } from '~/core/mt';
import { isMtEngineId } from '~/core/mt/types';
import { CLOUD_PRESETS } from '~/core/providers/presets';
import { activeSlot } from '~/core/providers/providerSlots';
import type { ProviderIconId } from '~/ui/ProviderIcon';
import type { ApiSettings, TranslationEngine } from '~/storage/schema';

export interface TranslationAttribution {
  /** Which mark to draw beside the label. */
  iconId: ProviderIconId;
  /** Brand or model name — locale-invariant, so never an i18n string. */
  label: string;
}

/**
 * Who produced a translation, for the credit line on the result card.
 *
 * With an LLM the model name is the useful part (that is what the reader
 * chose and what explains the wording); with a free service there is no model,
 * so the service's own name is the answer. A self-hosted runtime has no brand
 * to name either, so it falls back to the model too.
 */
export function translationAttribution(
  engine: TranslationEngine,
  api: ApiSettings,
): TranslationAttribution {
  if (isMtEngineId(engine)) {
    return { iconId: engine, label: MT_ENGINES[engine].shortLabel };
  }
  const slot = activeSlot(api);
  const brand = slot === 'local' || slot === 'custom' ? '' : CLOUD_PRESETS[slot].label;
  return { iconId: slot, label: api.model || brand };
}
