import { useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Switch } from '~/ui/components/Switch';
import { ApiStatusIndicator } from '~/ui/components/ApiStatusIndicator';
import { ProviderIcon } from '~/ui/ProviderIcon';
import { ChevronRight, Search } from '~/ui/icons';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { useProviderToggle } from './useProviderToggle';
import { useT } from '~/i18n';
import { ProviderDetail } from './ProviderDetail';
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from '~/core/providers/registry';

/**
 * The Providers page: the list, or one provider's own page.
 *
 * Choosing one replaces the list rather than expanding inside it, so the list
 * never jumps and a provider's settings get the whole column.
 */
export function ProvidersPanel() {
  const providers = useAppStore((s) => s.data.providers);
  const [selected, setSelected] = useState<ProviderId | null>(null);
  const [query, setQuery] = useState('');
  const { toggle, denied } = useProviderToggle();
  const t = useT();

  if (selected) {
    // Keyed so that opening a different provider builds a fresh form rather
    // than carrying the last one's local state — which endpoint mode it was in
    // — across to a provider it says nothing about.
    return <ProviderDetail key={selected} id={selected} onBack={() => setSelected(null)} />;
  }

  const q = query.trim().toLowerCase();
  const shown = PROVIDER_IDS.filter(
    (id) => !q || PROVIDERS[id].label.toLowerCase().includes(q) || id.includes(q),
  );

  return (
    <section class="ap-settings-panel">
    <SectionHeader label={t('sectionProviders')} description={t('openaiCompatible')} />
    {/* A box of its own with its own scrollbar, as in v0.2.2: fifteen
        providers laid out in full make a long, uniform wall of rows. */}
    <div class="flex h-[26rem] flex-col overflow-hidden rounded-md border border-ap-border bg-ap-surface">
      <div class="relative shrink-0 border-b border-ap-border">
        <Search
          size={13}
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ap-subtle"
        />
        <input
          type="search"
          value={query}
          placeholder={t('searchProviders')}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          class="h-9 w-full bg-transparent pl-8 pr-3 text-sm text-ap-fg placeholder:text-ap-subtle focus:outline-none"
        />
      </div>

      <ul class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {shown.map((id) => {
          const def = PROVIDERS[id];
          const cfg = providers[id];
          const isService = def.kind === 'service';
          return (
            <li key={id} class="border-b border-ap-border last:border-b-0">
              <div class="flex items-center gap-2.5 px-3 py-2.5">
                <ProviderIcon id={id} size={18} />
                <button
                  type="button"
                  // A free service has nothing behind it to open.
                  disabled={isService}
                  onClick={() => setSelected(id)}
                  class="flex min-w-0 flex-1 flex-col text-left"
                >
                  <span class="w-full truncate text-sm text-ap-fg">{def.label}</span>
                  <span class="w-full truncate font-mono text-2xs text-ap-subtle">
                    {isService
                      ? t('providerNoKey')
                      : cfg.model
                        ? cfg.models.length > 1 ? `${cfg.model} +${cfg.models.length - 1}` : cfg.model
                        : t('notConfigured')}
                  </span>
                </button>

                {/* Whether a provider actually answers, and how fast, is worth
                    knowing about the ones in use — and only measurable for
                    those, so a provider that is switched off keeps the chevron
                    that says it can still be opened. */}
                {cfg.enabled ? (
                  <ApiStatusIndicator provider={id} compact />
                ) : (
                  !isService && <ChevronRight size={13} class="shrink-0 text-ap-subtle" />
                )}

                <Switch checked={cfg.enabled} onChange={(on) => toggle(id, on)} label="" />
              </div>
              {denied === id && (
                <p class="px-3 pb-2 text-2xs leading-relaxed text-ap-danger">
                  {t('providerPermissionDenied')}
                </p>
              )}
            </li>
          );
        })}

        {shown.length === 0 && (
          <li class="px-3 py-6 text-center text-2xs text-ap-subtle">{t('noMatches')}</li>
        )}
      </ul>
    </div>
    </section>
  );
}
