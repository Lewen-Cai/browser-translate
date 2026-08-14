import { useState } from 'preact/hooks';
import { Input } from '~/ui/components/Input';
import { Select } from '~/ui/components/Select';
import { Switch } from '~/ui/components/Switch';
import { ApiStatusIndicator } from '~/ui/components/ApiStatusIndicator';
import { ProviderIcon } from '~/ui/ProviderIcon';
import { ChevronDown, Eye, EyeOff } from '~/ui/icons';
import { thinkingOptions } from '~/ui/thinkingOptions';
import { ensureHostPermission } from '~/ui/hostPermission';
import { useT } from '~/i18n';
import { cn } from '~/lib/cn';
import { PROVIDERS, supportsThinkingToggle, type ProviderId } from '~/core/providers/registry';
import type { ProviderConfig, ThinkingSetting } from '~/storage/schema';

interface Props {
  id: ProviderId;
  config: ProviderConfig;
  expanded: boolean;
  showKey: boolean;
  onToggleExpanded: () => void;
  onToggleKey: () => void;
  onChange: (patch: Partial<ProviderConfig>) => void;
}

/**
 * One provider in the list: what it is, whether it is on, and — when opened —
 * what it needs to work.
 *
 * The free services collapse to a name and a switch, because there is nothing
 * to fill in. Everything else opens to the endpoint, key and model, so a
 * provider can be set up before anything routes to it.
 */
export function ProviderRow({
  id,
  config,
  expanded,
  showKey,
  onToggleExpanded,
  onToggleKey,
  onChange,
}: Props) {
  const t = useT();
  const [denied, setDenied] = useState(false);
  const def = PROVIDERS[id];
  const isService = def.kind === 'service';
  const summary = isService ? t('providerNoKey') : config.model || t('notConfigured');

  /**
   * Switching a provider on can require a host grant first — the request has to
   * go out from inside this click, so nothing is awaited before it. Turning one
   * off never asks for anything.
   */
  function onToggleEnabled(enabled: boolean) {
    if (!enabled) {
      setDenied(false);
      onChange({ enabled: false });
      return;
    }
    void ensureHostPermission(id).then((granted) => {
      setDenied(!granted);
      if (granted) onChange({ enabled: true });
    });
  }

  return (
    <div
      class={cn(
        'rounded-md border transition-colors',
        config.enabled ? 'border-ap-border-strong bg-ap-surface' : 'border-ap-border',
      )}
    >
      <div class="flex items-center gap-2.5 px-3 py-2.5">
        <ProviderIcon id={id} size={18} />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm text-ap-fg">{def.label}</div>
          <div class="truncate font-mono text-2xs text-ap-subtle">{summary}</div>
        </div>

        {!isService && (
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
            aria-label={def.label}
            class="text-ap-muted transition-colors hover:text-ap-fg"
          >
            <ChevronDown
              size={14}
              class={cn('transition-transform', expanded && 'rotate-180')}
            />
          </button>
        )}

        <Switch checked={config.enabled} onChange={onToggleEnabled} label="" />
      </div>

      {denied && (
        <p class="border-t border-ap-border px-3 py-2 text-2xs leading-relaxed text-ap-danger">
          {t('providerPermissionDenied')}
        </p>
      )}

      {expanded && !isService && (
        <div class="space-y-4 border-t border-ap-border px-3 py-3">
          {def.endpoints.length > 1 && (
            <Select
              label={t('cloudEndpoint')}
              value={config.baseUrl}
              options={def.endpoints.map((e) => ({ value: e.baseUrl, label: e.label }))}
              onChange={(e) => onChange({ baseUrl: (e.target as HTMLSelectElement).value })}
            />
          )}

          <Input
            label={t('baseUrl')}
            value={config.baseUrl}
            // A vendor with one fixed endpoint has nothing to choose; a gateway
            // or a self-hosted runtime is nothing but the address you type.
            disabled={def.endpoints.length > 0}
            mono
            onInput={(e) => onChange({ baseUrl: (e.target as HTMLInputElement).value })}
          />

          {def.needsKey && (
            <div class="flex items-end gap-2">
              <div class="flex-1">
                <Input
                  label={t('apiKey')}
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  mono
                  onInput={(e) => onChange({ apiKey: (e.target as HTMLInputElement).value })}
                />
              </div>
              <button
                onClick={onToggleKey}
                class="flex h-8 w-8 items-center justify-center rounded-md border border-ap-border bg-ap-surface text-ap-muted transition-colors hover:border-ap-border-strong hover:text-ap-fg"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          )}

          <Input
            label={t('model')}
            value={config.model}
            mono
            onInput={(e) => onChange({ model: (e.target as HTMLInputElement).value })}
          />

          <Select
            label={t('thinkingLabel')}
            value={config.thinking ?? 'off'}
            disabled={!supportsThinkingToggle(id)}
            hint={supportsThinkingToggle(id) ? t('thinkingDesc') : t('thinkingUnsupported')}
            options={thinkingOptions(t('thinkingOff'))}
            onChange={(e) =>
              onChange({ thinking: (e.target as HTMLSelectElement).value as ThinkingSetting })
            }
          />

          <ApiStatusIndicator provider={id} />
        </div>
      )}
    </div>
  );
}
