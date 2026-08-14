import { ProviderSelect } from '~/ui/components/ProviderSelect';
import { engineOptions } from '~/ui/engineOptions';
import { useT } from '~/i18n';
import { PROVIDERS, type ProviderId } from '~/core/providers/registry';
import { TRANSLATION_SURFACES, type TranslationSurface } from '~/storage/schema';
import type { EngineRouting, ProvidersConfig } from '~/storage/schema';
import type { StringKey } from '~/i18n/strings';

interface Props {
  engines: EngineRouting;
  providers: ProvidersConfig;
  onChange: (next: EngineRouting) => void;
  /** Drop the explanatory notes, for the popup's tighter layout. */
  compact?: boolean;
}

const SURFACE_LABEL: Record<TranslationSurface, StringKey> = {
  selection: 'surfaceSelection',
  fullPage: 'surfaceFullPage',
  subtitle: 'surfaceSubtitle',
};

/**
 * One provider per surface.
 *
 * A single control for all three read as though the three jobs were the same
 * one. They are not: a free service is instant and free, which is what a whole
 * page or an hour of subtitles wants, while a model reads context and is the
 * only kind of provider that can answer a single word with a dictionary entry.
 */
export function EngineRoutingPicker({ engines, providers, onChange, compact = false }: Props) {
  const t = useT();
  const labels = { services: t('engineGroupServices'), models: t('engineGroupModel') };
  const usesService = TRANSLATION_SURFACES.some((s) => PROVIDERS[engines[s]].kind === 'service');

  return (
    <div class="space-y-2.5">
      {TRANSLATION_SURFACES.map((surface) => (
        <ProviderSelect
          key={surface}
          label={t(SURFACE_LABEL[surface])}
          value={engines[surface]}
          options={engineOptions(providers, labels, { keep: engines[surface] })}
          onChange={(next) => onChange({ ...engines, [surface]: next as ProviderId })}
        />
      ))}

      {/* Only worth saying where the choice was just made, and only when it
          costs the reader something they might not expect. */}
      {!compact && PROVIDERS[engines.selection].kind === 'service' && (
        <p class="text-2xs leading-relaxed text-ap-subtle">{t('dictionaryNeedsModel')}</p>
      )}

      {usesService && (
        <p class="rounded-md border border-ap-border bg-ap-fg/[0.03] px-2.5 py-2 text-2xs leading-relaxed text-ap-muted">
          {t('engineFreeDisclaimer')}
        </p>
      )}
    </div>
  );
}
