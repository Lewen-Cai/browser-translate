import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Button } from '~/ui/components/Button';
import { Check, Loader2, Plus, RefreshCw, Search, Star, X } from '~/ui/icons';
import { useT } from '~/i18n';
import { pingApi } from '~/messaging/client';
import { addModel, removeModel, setDefaultModel, type ModelSet } from '~/core/providers/models';
import type { ProviderId } from '~/core/providers/registry';
import { cn } from '~/lib/cn';

interface Props {
  id: ProviderId;
  value: ModelSet;
  onChange: (next: ModelSet) => void;
}

/** How many fetched models to draw at once. OpenRouter alone lists hundreds. */
const FETCH_SHOWN = 100;

type Fetched =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'done'; models: string[] };

/**
 * The models kept for one provider, and which of them is the default.
 *
 * Kept as a list so switching between them — on a surface, or on the card — is
 * a pick rather than a retyped name. Names can be typed, or picked from what the
 * endpoint's own `/models` lists, which is the same request the status check
 * already makes.
 */
export function ModelList({ id, value, onChange }: Props) {
  const t = useT();
  const [draft, setDraft] = useState('');
  const [fetched, setFetched] = useState<Fetched>({ state: 'idle' });
  const [query, setQuery] = useState('');
  const panel = useRef<HTMLDivElement>(null);

  // The detail page is a fixed-height box, and the result lands at its foot —
  // below the fold, where a click that seemed to do nothing would leave it.
  useEffect(() => {
    if (fetched.state === 'done' || fetched.state === 'error') {
      panel.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
  }, [fetched.state]);

  function add(name: string) {
    onChange(addModel(value, name));
  }

  async function fetchList() {
    setFetched({ state: 'loading' });
    const res = await pingApi(id);
    if (res.type === 'ping:error') {
      setFetched({ state: 'error', message: res.message });
      return;
    }
    const models = [...new Set(res.availableModels)].sort((a, b) => a.localeCompare(b));
    setFetched({ state: 'done', models });
  }

  const matches = useMemo(() => {
    if (fetched.state !== 'done') return [];
    const q = query.trim().toLowerCase();
    return q ? fetched.models.filter((m) => m.toLowerCase().includes(q)) : fetched.models;
  }, [fetched, query]);

  return (
    <div>
      <div class="mb-1.5 flex items-center justify-between">
        <span class="text-xs font-medium text-ap-muted">{t('modelsLabel')}</span>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => void fetchList()}
          disabled={fetched.state === 'loading'}
        >
          {fetched.state === 'loading' ? <Loader2 size={12} class="animate-spin" /> : <RefreshCw size={12} />}
          {t('modelsFetch')}
        </Button>
      </div>

      {value.models.length === 0 ? (
        <p class="rounded-md border border-dashed border-ap-border px-3 py-2.5 text-xs text-ap-subtle">
          {t('modelsEmpty')}
        </p>
      ) : (
        <ul class="overflow-hidden rounded-md border border-ap-border">
          {value.models.map((m) => {
            const isDefault = m === value.model;
            return (
              <li key={m} class="flex items-center gap-2 border-b border-ap-border px-2.5 py-1.5 last:border-b-0">
                <button
                  type="button"
                  onClick={() => onChange(setDefaultModel(value, m))}
                  disabled={isDefault}
                  title={isDefault ? t('modelDefault') : t('modelSetDefault')}
                  aria-label={isDefault ? t('modelDefault') : t('modelSetDefault')}
                  class={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors',
                    isDefault ? 'text-ap-brand' : 'text-ap-subtle hover:text-ap-fg',
                  )}
                >
                  <Star size={13} fill={isDefault ? 'currentColor' : 'none'} />
                </button>
                <span class="min-w-0 flex-1 truncate font-mono text-xs text-ap-fg" title={m}>{m}</span>
                {isDefault && (
                  <span class="shrink-0 rounded bg-ap-brand/10 px-1.5 py-0.5 text-2xs text-ap-brand">
                    {t('modelDefault')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onChange(removeModel(value, m))}
                  aria-label={`${t('modelRemove')} ${m}`}
                  title={t('modelRemove')}
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ap-subtle transition-colors hover:text-ap-danger"
                >
                  <X size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        class="mt-2 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(draft);
          setDraft('');
        }}
      >
        <input
          value={draft}
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          placeholder={t('modelAddPlaceholder')}
          aria-label={t('modelAddPlaceholder')}
          class="h-8 min-w-0 flex-1 rounded-md border border-ap-border bg-ap-surface px-2.5 font-mono text-sm text-ap-fg placeholder:font-sans placeholder:text-ap-subtle focus:border-ap-brand focus:outline-none"
        />
        <Button variant="secondary" type="submit" disabled={!draft.trim()}>
          <Plus size={12} />
          {t('modelAdd')}
        </Button>
      </form>
      <p class="mt-1 text-2xs text-ap-muted">{t('modelsHint')}</p>

      <div ref={panel}>
      {fetched.state === 'error' && (
        <p class="mt-2 text-2xs text-ap-danger">{fetched.message}</p>
      )}
      {fetched.state === 'done' && (
        <div class="mt-2 rounded-md border border-ap-border">
          {fetched.models.length === 0 ? (
            <p class="px-3 py-2.5 text-xs text-ap-subtle">{t('modelsNoneFetched')}</p>
          ) : (
            <>
              <div class="flex items-center gap-2 border-b border-ap-border px-2.5">
                <Search size={12} class="shrink-0 text-ap-subtle" />
                <input
                  value={query}
                  onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                  placeholder={t('modelsSearch')}
                  aria-label={t('modelsSearch')}
                  class="h-8 min-w-0 flex-1 bg-transparent text-sm text-ap-fg placeholder:text-ap-subtle focus:outline-none"
                />
                <span class="shrink-0 text-2xs text-ap-subtle">
                  {t('modelsFetchedCount').replace('{count}', String(matches.length))}
                </span>
              </div>
              <ul class="max-h-44 overflow-y-auto py-1">
                {matches.slice(0, FETCH_SHOWN).map((m) => {
                  const kept = value.models.includes(m);
                  return (
                    <li key={m}>
                      <button
                        type="button"
                        onClick={() => onChange(kept ? removeModel(value, m) : addModel(value, m))}
                        aria-pressed={kept}
                        class={cn(
                          'flex w-full items-center gap-2 px-2.5 py-1 text-left font-mono text-xs transition-colors hover:bg-ap-fg/5',
                          kept ? 'text-ap-brand' : 'text-ap-fg',
                        )}
                      >
                        <span class="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                          {kept ? <Check size={12} /> : <Plus size={12} class="text-ap-subtle" />}
                        </span>
                        <span class="min-w-0 flex-1 truncate" title={m}>{m}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {matches.length > FETCH_SHOWN && (
                <p class="border-t border-ap-border px-2.5 py-1.5 text-2xs text-ap-subtle">{t('modelsRefine')}</p>
              )}
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
