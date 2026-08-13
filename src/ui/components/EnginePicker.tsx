import { MT_ENGINES } from '~/core/mt';
import { MT_ENGINE_IDS } from '~/core/mt/types';
import { ProviderIcon } from '~/ui/ProviderIcon';
import { SegmentedControl } from '~/ui/components/SegmentedControl';
import { useT } from '~/i18n';
import { cn } from '~/lib/cn';
import type { TranslationEngine } from '~/storage/schema';

type EngineKind = 'mt' | 'llm';

interface Props {
  value: TranslationEngine;
  onChange: (engine: TranslationEngine) => void;
  /** Drop the section label, for the popup's tighter layout. */
  compact?: boolean;
}

/**
 * Two-step choice: the kind of translator first, then which one.
 *
 * Flattening all three into one row implied they were interchangeable, which
 * they are not — a translation service needs no configuration at all, while an
 * LLM needs an endpoint, a key and a model. Splitting them also makes it
 * obvious why the API fields below disappear.
 */
export function EnginePicker({ value, onChange, compact = false }: Props) {
  const t = useT();
  const kind: EngineKind = value === 'llm' ? 'llm' : 'mt';

  return (
    <div>
      <SegmentedControl<EngineKind>
        label={compact ? undefined : t('engine')}
        value={kind}
        fullWidth
        options={[
          { value: 'mt', label: t('engineKindService') },
          { value: 'llm', label: t('engineKindLlm') },
        ]}
        // Leaving the service category picks Microsoft; coming back to it keeps
        // whichever service was already chosen.
        onChange={(next) => onChange(next === 'llm' ? 'llm' : kind === 'mt' ? value : 'microsoft')}
      />

      {kind === 'mt' && (
        <>
          <div class="mt-2 grid grid-cols-2 gap-2">
            {MT_ENGINE_IDS.map((id) => {
              const selected = value === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(id)}
                  class={cn(
                    'flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors',
                    selected
                      ? 'border-ap-brand bg-ap-surface'
                      : 'border-ap-border bg-ap-surface hover:border-ap-border-strong',
                  )}
                >
                  <ProviderIcon id={id} size={16} />
                  <span
                    class={cn('flex-1 truncate text-xs', selected ? 'text-ap-fg' : 'text-ap-muted')}
                  >
                    {MT_ENGINES[id].shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
          <p class="mt-2 rounded-md border border-ap-border bg-ap-fg/[0.03] px-2.5 py-2 text-2xs leading-relaxed text-ap-muted">
            {t('engineFreeDisclaimer')}
          </p>
        </>
      )}

      {kind === 'llm' && !compact && (
        <span class="mt-2 block text-2xs text-ap-subtle">{t('engineHint')}</span>
      )}
    </div>
  );
}
