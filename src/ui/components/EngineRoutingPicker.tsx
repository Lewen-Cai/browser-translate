import { ProviderSelect } from '~/ui/components/ProviderSelect';
import { routeOptions } from '~/ui/engineOptions';
import { effectiveRouteKey, parseRouteKey, routeProblem } from '~/core/engines/routing';
import { useT } from '~/i18n';
import { AppWindow, Captions, FileText } from '~/ui/icons';
import { TRANSLATION_SURFACES, type TranslationSurface } from '~/storage/schema';
import type { EngineRouting, ProvidersConfig } from '~/storage/schema';
import type { StringKey } from '~/i18n/strings';

interface Props {
  engines: EngineRouting;
  providers: ProvidersConfig;
  onChange: (next: EngineRouting) => void;
  /** The popup's tighter layout: model ids shown without the provider name. */
  compact?: boolean;
}

const SURFACE_ICON = { selection: AppWindow, fullPage: FileText, subtitle: Captions } as const;

const SURFACE_LABEL: Record<TranslationSurface, StringKey> = {
  selection: 'surfaceSelection',
  fullPage: 'surfaceFullPage',
  subtitle: 'surfaceSubtitle',
};

/**
 * One provider — and for a model provider, one of its models — per surface.
 *
 * A single control for all three read as though the three jobs were the same
 * one. They are not: a free service is instant and free, which is what a whole
 * page or an hour of subtitles wants, while a model reads context and is the
 * only kind of provider that can answer a single word with a dictionary entry.
 */
export function EngineRoutingPicker({ engines, providers, onChange, compact = false }: Props) {
  const t = useT();
  const labels = { services: t('engineGroupServices'), models: t('engineGroupModel') };

  const anyProblem = TRANSLATION_SURFACES.some((s) => routeProblem(engines[s], providers));

  return (
    <div class={compact ? 'ap-route-compact space-y-3' : 'space-y-3'}>
      {TRANSLATION_SURFACES.map((surface) => {
        const route = engines[surface];
        const problem = routeProblem(route, providers);
        return (
          <ProviderSelect
            key={surface}
            inline
            label={t(SURFACE_LABEL[surface])}
            labelIcon={SURFACE_ICON[surface]}
            // A surface that is not configured shows a placeholder rather
            // than a provider that will not be used.
            value={problem || !route ? '' : effectiveRouteKey(route)}
            options={routeOptions(providers, labels, { compact })}
            placeholder={t('notConfigured')}
            emptyText={t('routeNoProviders')}
            preferDetail={compact}
            onChange={(next) => {
              const picked = parseRouteKey(next);
              if (picked) onChange({ ...engines, [surface]: picked });
            }}
          />
        );
      })}

      {/* One explanation for every "Not configured" above, said once under
          the controls that fix it rather than repeated under each. */}
      {anyProblem && (
        <p role="status" class="text-2xs leading-relaxed text-ap-danger">{t('routeNotConfiguredNote')}</p>
      )}
    </div>
  );
}
