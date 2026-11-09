import { useMemo, useState } from 'preact/hooks';
import { Button } from '~/ui/components/Button';
import { ModelIcon } from '~/ui/ModelIcon';
import { Check, Loader2, Plus, RefreshCw, X } from '~/ui/icons';
import { SearchField } from '~/ui/components/SearchField';
import { useT } from '~/i18n';
import { addModel, removeModel, type ModelSet } from '~/core/providers/models';
import { cn } from '~/lib/cn';
import type { Probe } from './useProviderProbe';

interface KeptProps {
  value: ModelSet;
  onChange: (next: ModelSet) => void;
}

/** Shared frame for both columns: a title row and a bordered body. */
function Column({ title, aside, children }: { title: string; aside?: preact.ComponentChildren; children: preact.ComponentChildren }) {
  return (
    <div class="flex min-w-0 flex-col">
      <div class="mb-2 flex h-7 items-center justify-between gap-2">
        <span class="text-sm font-medium text-ap-fg">{title}</span>
        {aside}
      </div>
      {children}
    </div>
  );
}

/**
 * The models kept for one provider.
 *
 * Kept as a list so switching between them — on a surface, or on the card — is
 * a pick rather than a retyped name. There is no default to manage: every model
 * is offered by name wherever one is chosen, and the only fallback (a surface
 * whose model was removed, or settings from before v0.2.3) is simply the first
 * model on the list.
 */
export function KeptModels({ value, onChange }: KeptProps) {
  const t = useT();
  const [draft, setDraft] = useState('');

  return (
    <Column
      title={t('modelsYours')}
      aside={value.models.length > 0 && <span class="text-2xs text-ap-subtle">{value.models.length}</span>}
    >
      {value.models.length === 0 ? (
        <p class="rounded-lg border border-dashed border-ap-border px-3 py-4 text-xs leading-relaxed text-ap-subtle">
          {t('modelsEmpty')}
        </p>
      ) : (
        <ul class="overflow-hidden rounded-lg border border-ap-border">
          {value.models.map((m) => {
            return (
              <li key={m} class="flex items-center gap-2.5 border-b border-ap-border px-3 py-2 last:border-b-0">
                <ModelIcon model={m} size={16} />
                <span class="min-w-0 flex-1 truncate font-mono text-xs text-ap-fg" title={m}>{m}</span>
                <button
                  type="button"
                  onClick={() => onChange(removeModel(value, m))}
                  aria-label={`${t('modelRemove')} ${m}`}
                  title={t('modelRemove')}
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ap-subtle transition-colors hover:text-ap-danger"
                >
                  <X size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        class="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onChange(addModel(value, draft));
          setDraft('');
        }}
      >
        <input
          value={draft}
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          placeholder={t('modelAddPlaceholder')}
          aria-label={t('modelAddPlaceholder')}
          class="h-8 min-w-0 flex-1 rounded-md border border-ap-border bg-ap-surface px-2.5 font-mono text-xs text-ap-fg placeholder:font-sans placeholder:text-ap-subtle focus:border-ap-brand focus:outline-none"
        />
        <Button variant="secondary" type="submit" disabled={!draft.trim()}>
          <Plus size={12} />
          {t('modelAdd')}
        </Button>
      </form>
    </Column>
  );
}

/** How many listed models to draw at once. OpenRouter alone lists hundreds. */
const SHOWN = 100;

interface AvailableProps {
  probe: Probe;
  onRefresh: () => void;
  value: ModelSet;
  onChange: (next: ModelSet) => void;
}

/**
 * What the endpoint itself says it serves, from the same `/models` request that
 * tells whether the connection works — so the list is simply there once the
 * key is, with nothing to press. Clicking one keeps it; clicking a kept one
 * lets it go.
 */
export function AvailableModels({ probe, onRefresh, value, onChange }: AvailableProps) {
  const t = useT();
  const [query, setQuery] = useState('');

  const all = probe.state === 'ok' ? probe.models : [];
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((m) => m.toLowerCase().includes(q)) : all;
  }, [all, query]);

  const refresh = (
    <Button variant="ghost" size="sm" type="button" onClick={onRefresh} disabled={probe.state === 'pending' || probe.state === 'idle'}>
      {probe.state === 'pending' ? <Loader2 size={12} class="animate-spin" /> : <RefreshCw size={12} />}
      {t('modelsFetch')}
    </Button>
  );

  let body: preact.ComponentChildren;
  if (probe.state === 'idle') {
    body = <Placeholder>{t('modelsNeedConnection')}</Placeholder>;
  } else if (probe.state === 'pending' && all.length === 0) {
    body = <Placeholder><Loader2 size={14} class="mx-auto animate-spin" /></Placeholder>;
  } else if (probe.state === 'error') {
    body = <Placeholder danger>{probe.status ? `HTTP ${probe.status} · ${probe.message}` : probe.message}</Placeholder>;
  } else if (all.length === 0) {
    body = <Placeholder>{t('modelsNoneFetched')}</Placeholder>;
  } else {
    body = (
      <div class="overflow-hidden rounded-lg border border-ap-border">
        <SearchField
          value={query}
          onInput={setQuery}
          placeholder={t('modelsSearch')}
          clearLabel={t('searchClear')}
          trailing={<span class="shrink-0 text-2xs text-ap-subtle">
            {t('modelsFetchedCount').replace('{count}', String(matches.length))}
          </span>}
        />
        <ul class="h-72 overflow-y-auto overscroll-contain py-1">
          {matches.slice(0, SHOWN).map((m) => {
            const kept = value.models.includes(m);
            return (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => onChange(kept ? removeModel(value, m) : addModel(value, m))}
                  aria-pressed={kept}
                  class={cn(
                    'flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-ap-fg/5',
                    kept && 'bg-ap-brand/5',
                  )}
                >
                  <ModelIcon model={m} size={14} />
                  <span class={cn('min-w-0 flex-1 truncate font-mono text-xs', kept ? 'text-ap-brand' : 'text-ap-fg')} title={m}>{m}</span>
                  {kept
                    ? <Check size={13} class="shrink-0 text-ap-brand" />
                    : <Plus size={13} class="shrink-0 text-ap-subtle" />}
                </button>
              </li>
            );
          })}
          {matches.length === 0 && <li class="px-3 py-6 text-center text-2xs text-ap-subtle">{t('noMatches')}</li>}
        </ul>
        {matches.length > SHOWN && (
          <p class="border-t border-ap-border px-3 py-1.5 text-2xs text-ap-subtle">{t('modelsRefine')}</p>
        )}
      </div>
    );
  }

  return <Column title={t('modelsAvailable')} aside={refresh}>{body}</Column>;
}

function Placeholder({ children, danger }: { children: preact.ComponentChildren; danger?: boolean }) {
  return (
    <div class={cn(
      'flex min-h-[7rem] items-center justify-center rounded-lg border border-dashed border-ap-border px-4 py-6 text-center text-xs leading-relaxed',
      danger ? 'text-ap-danger' : 'text-ap-subtle',
    )}>
      <div class="w-full">{children}</div>
    </div>
  );
}
