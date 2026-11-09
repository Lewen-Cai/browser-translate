import { useEffect, useRef, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Input } from '~/ui/components/Input';
import { Select } from '~/ui/components/Select';
import { Switch } from '~/ui/components/Switch';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { ProviderIcon } from '~/ui/ProviderIcon';
import { ChevronRight, Eye, EyeOff } from '~/ui/icons';
import { dialectOptions, thinkingOptions } from '~/ui/thinkingOptions';
import { useT } from '~/i18n';
import { PROVIDERS, type ProviderId } from '~/core/providers/registry';
import { dialectIsChosen, isProviderReady, supportsThinking } from '~/core/providers/resolve';
import type { ThinkingDialect } from '~/core/providers/thinking';
import type { ProviderConfig, ThinkingSetting } from '~/storage/schema';
import { AvailableModels, KeptModels } from './ModelList';
import { credentialsOf, useProviderProbe, type Probe } from './useProviderProbe';
import { useProviderToggle } from './useProviderToggle';
import { cn } from '~/lib/cn';

interface Props {
  id: ProviderId;
  onBack: () => void;
}

/**
 * One provider's settings, as a page of its own.
 *
 * Laid out as separate cards rather than one scrolling box: the connection, the
 * models and the reasoning controls are separate questions, and the model lists
 * need the room — side by side where the window allows, so what you keep and
 * what the endpoint offers are both in view while you choose.
 */
export function ProviderDetail({ id, onBack }: Props) {
  const config = useAppStore((s) => s.data.providers[id]);
  const updateProvider = useAppStore((s) => s.updateProvider);
  const { toggle, denied } = useProviderToggle();
  const { probe, refresh } = useProviderProbe(id, config);
  const [showKey, setShowKey] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const t = useT();
  const def = PROVIDERS[id];

  /**
   * Whether the address is being typed rather than picked.
   *
   * Starts true for a stored address the list does not contain, so a workspace
   * host survives a trip through this page instead of being silently snapped
   * back to whichever preset happened to be first.
   */
  const [typingEndpoint, setTypingEndpoint] = useState(
    def.endpoints.length > 0 && !def.endpoints.some((e) => e.baseUrl === config.baseUrl),
  );
  const endpointEditable = def.endpoints.length === 0 || typingEndpoint;

  /**
   * Whether this visit may switch the provider on by itself.
   *
   * Armed when the provider could not be used when the page opened — the case
   * of setting one up — and re-armed whenever the address or key is edited.
   * Not armed for a provider that was already usable and is off: someone who
   * switched it off and comes back to tidy its model list does not want it on
   * again. Flipping the switch by hand disarms it until the address or key
   * changes, so an explicit choice is never overridden by a later probe.
   */
  const armed = useRef(!isProviderReady(id, config));

  function set(patch: Partial<ProviderConfig>) {
    if ('baseUrl' in patch || 'apiKey' in patch) armed.current = true;
    void updateProvider(id, patch);
  }

  // Switch on by itself once it can answer: the key has just been shown to
  // work (by a probe made with the credentials as they stand now, not a stale
  // one) and there is a model to ask. Otherwise configuring a provider ends in
  // a trip back to the list to find its switch.
  useEffect(() => {
    if (!armed.current || config.enabled) return;
    if (probe.state !== 'ok' || probe.credentials !== credentialsOf(config)) return;
    if (!isProviderReady(id, config)) return;
    armed.current = false;
    setAutoEnabled(true);
    void updateProvider(id, { enabled: true });
  }, [probe, config, id, updateProvider]);

  return (
    <div class="space-y-4">
      <button
        type="button"
        onClick={onBack}
        class="flex items-center gap-1 text-sm text-ap-muted transition-colors hover:text-ap-fg"
      >
        <ChevronRight size={14} class="rotate-180" />
        {t('providersAll')}
      </button>

      <section class="ap-settings-panel">
        <div class="flex items-center gap-3">
          <ProviderIcon id={id} size={30} />
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-base font-semibold text-ap-fg">{def.label}</h2>
            <ConnectionStatus probe={probe} credentials={credentialsOf(config)} />
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <span class="text-sm text-ap-muted">{t('providerEnabledLabel')}</span>
            <Switch
              checked={config.enabled}
              onChange={(on) => {
                armed.current = false;
                setAutoEnabled(false);
                toggle(id, on);
              }}
              label=""
            />
          </div>
        </div>
        {autoEnabled && config.enabled && (
          <p class="mt-3 rounded-md bg-ap-success/10 px-3 py-2 text-xs text-ap-success">{t('providerAutoEnabled')}</p>
        )}
        {denied === id && (
          <p class="mt-3 text-xs leading-relaxed text-ap-danger">{t('providerPermissionDenied')}</p>
        )}
      </section>

      <section class="ap-settings-panel">
        <SectionHeader label={t('sectionConnection')} />
        <div class="space-y-4">
          {def.endpoints.length > 1 && (
            <Select
              label={t('cloudEndpoint')}
              value={typingEndpoint ? '' : config.baseUrl}
              // Worth saying wherever there is more than one: these are not
              // mirrors of one endpoint but separate accounts, regions or plans,
              // and a key that works on one is usually rejected by the next.
              hint={t('endpointKeyScoped')}
              options={[
                ...def.endpoints.map((e) => ({ value: e.baseUrl, label: e.label })),
                ...(def.allowCustomEndpoint || typingEndpoint
                  ? [{ value: '', label: t('endpointCustom') }]
                  : []),
              ]}
              onChange={(e) => {
                const next = (e.target as HTMLSelectElement).value;
                setTypingEndpoint(next === '');
                // Choosing "custom" leaves the address alone — it is the one
                // already there that is about to be edited.
                if (next) set({ baseUrl: next });
              }}
            />
          )}

          <div class={cn('grid gap-4', def.needsKey && 'lg:grid-cols-2')}>
            <Input
              label={t('baseUrl')}
              value={config.baseUrl}
              // A vendor whose public endpoints are the whole story has nothing
              // to type; a self-hosted runtime, or a vendor handing out
              // addresses we cannot enumerate, is nothing but the address.
              disabled={!endpointEditable}
              mono
              onInput={(e) => set({ baseUrl: (e.target as HTMLInputElement).value })}
            />

            {def.needsKey && (
              <div class="flex items-end gap-2">
                <div class="min-w-0 flex-1">
                  <Input
                    label={t('apiKey')}
                    type={showKey ? 'text' : 'password'}
                    value={config.apiKey}
                    mono
                    onInput={(e) => set({ apiKey: (e.target as HTMLInputElement).value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ap-border bg-ap-surface text-ap-muted transition-colors hover:border-ap-border-strong hover:text-ap-fg"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section class="ap-settings-panel">
        <SectionHeader label={t('modelsLabel')} description={t('modelsHint')} />
        <div class="grid gap-6 lg:grid-cols-2">
          <KeptModels value={config} onChange={(next) => set(next)} />
          <AvailableModels probe={probe} onRefresh={refresh} value={config} onChange={(next) => set(next)} />
        </div>
      </section>

      <section class="ap-settings-panel">
        <SectionHeader label={t('sectionReasoning')} />
        <div class={cn('grid gap-4', dialectIsChosen(id) && 'lg:grid-cols-2')}>
          {/* Where the registry knows the vendor it also knows the parameter,
              and offering a choice there could only let someone be wrong about
              something already settled. A custom endpoint or a local runtime is
              the opposite case: only its operator knows what the software behind
              it reads, so the choice belongs to them. */}
          {dialectIsChosen(id) && (
            <Select
              label={t('thinkingDialect')}
              value={config.thinkingDialect ?? 'none'}
              hint={t('thinkingDialectHint')}
              options={dialectOptions(t('thinkingDialectNone'))}
              onChange={(e) =>
                set({ thinkingDialect: (e.target as HTMLSelectElement).value as ThinkingDialect })
              }
            />
          )}

          <Select
            label={t('thinkingLabel')}
            value={config.thinking ?? 'off'}
            disabled={!supportsThinking(id, config)}
            hint={
              supportsThinking(id, config)
                ? t('thinkingDesc')
                : dialectIsChosen(id)
                  ? t('thinkingNeedsDialect')
                  : t('thinkingUnsupported')
            }
            options={thinkingOptions(t('thinkingOff'))}
            onChange={(e) =>
              set({ thinking: (e.target as HTMLSelectElement).value as ThinkingSetting })
            }
          />
        </div>
      </section>
    </div>
  );
}

/**
 * Whether the connection works, under the provider's name.
 *
 * Says "connected" as soon as the key is accepted, model or not — the routing
 * status elsewhere waits for a model, but on this page the first thing worth
 * knowing is whether what was just pasted works.
 */
function ConnectionStatus({ probe, credentials }: { probe: Probe; credentials: string }) {
  const t = useT();
  const stale = (probe.state === 'ok' || probe.state === 'error') && probe.credentials !== credentials;
  const [dot, text, detail] =
    probe.state === 'idle'
      ? ['bg-ap-subtle', t('notConfigured'), '']
      : probe.state === 'pending' || stale
        ? ['animate-pulse bg-amber-500', t('statusChecking'), '']
        : probe.state === 'ok'
          ? ['bg-ap-success', t('statusConnected'), `${probe.latencyMs}ms`]
          : ['bg-ap-danger', t('statusOffline'), probe.status ? `HTTP ${probe.status}` : ''];
  return (
    <div
      class="mt-0.5 flex items-center gap-1.5 text-xs text-ap-muted"
      title={probe.state === 'error' ? probe.message : undefined}
    >
      <span class={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      <span>{text}</span>
      {detail && <span class="font-mono text-2xs text-ap-subtle">{detail}</span>}
    </div>
  );
}
