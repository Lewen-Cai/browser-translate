import { useEffect, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Input } from '~/ui/components/Input';
import { Select } from '~/ui/components/Select';
import { ApiStatusIndicator } from '~/ui/components/ApiStatusIndicator';
import { ProviderIcon } from '~/ui/ProviderIcon';
import { ChevronRight, Eye, EyeOff } from '~/ui/icons';
import { thinkingOptions } from '~/ui/thinkingOptions';
import { useT } from '~/i18n';
import { PROVIDERS, supportsThinkingToggle, type ProviderId } from '~/core/providers/registry';
import type { ProviderConfig, ThinkingSetting } from '~/storage/schema';

interface Props {
  id: ProviderId;
  onBack: () => void;
}

/**
 * One provider's settings, filling the same box the list was in.
 *
 * Same height as the list so the page does not jump when you go in or out, and
 * its own scrollbar so a long form does not push the rest of the page down.
 */
export function ProviderDetail({ id, onBack }: Props) {
  const config = useAppStore((s) => s.data.providers[id]);
  const updateProvider = useAppStore((s) => s.updateProvider);
  const [showKey, setShowKey] = useState(false);
  const t = useT();
  const def = PROVIDERS[id];

  // Re-probe once editing settles. Every keystroke changes the stored config,
  // and probing each one would fire a request per character.
  const [pingNonce, setPingNonce] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setPingNonce((n) => n + 1), 1500);
    return () => clearTimeout(timer);
  }, [config.baseUrl, config.apiKey, config.model]);

  function set(patch: Partial<ProviderConfig>) {
    void updateProvider(id, patch);
  }

  return (
    <div class="flex h-[26rem] flex-col overflow-hidden rounded-md border border-ap-border bg-ap-surface">
      <div class="flex shrink-0 items-center gap-2 border-b border-ap-border px-3 py-2">
        <button
          type="button"
          onClick={onBack}
          class="flex items-center gap-1 text-2xs font-mono uppercase tracking-wider text-ap-muted transition-colors hover:text-ap-fg"
        >
          <ChevronRight size={12} class="rotate-180" />
          {t('back')}
        </button>
        <span class="ml-auto flex items-center gap-2">
          <ProviderIcon id={id} size={14} />
          <span class="text-sm text-ap-fg">{def.label}</span>
          {/* Beside the name rather than under the form: it answers "is this
              working", which is what you are here to find out, and at the foot
              of a scrolling form it was often out of sight. */}
          <ApiStatusIndicator provider={id} pingNonce={pingNonce} compact />
        </span>
      </div>

      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {def.endpoints.length > 1 && (
          <Select
            label={t('cloudEndpoint')}
            value={config.baseUrl}
            options={def.endpoints.map((e) => ({ value: e.baseUrl, label: e.label }))}
            onChange={(e) => set({ baseUrl: (e.target as HTMLSelectElement).value })}
          />
        )}

        <Input
          label={t('baseUrl')}
          value={config.baseUrl}
          // A vendor with fixed endpoints has nothing to type; a self-hosted
          // runtime or a hand-entered endpoint is nothing but the address.
          disabled={def.endpoints.length > 0}
          mono
          onInput={(e) => set({ baseUrl: (e.target as HTMLInputElement).value })}
        />

        {def.needsKey && (
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <Input
                label={t('apiKey')}
                type={showKey ? 'text' : 'password'}
                value={config.apiKey}
                mono
                onInput={(e) => set({ apiKey: (e.target as HTMLInputElement).value })}
              />
            </div>
            <button
              onClick={() => setShowKey((v) => !v)}
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
          onInput={(e) => set({ model: (e.target as HTMLInputElement).value })}
        />

        <Select
          label={t('thinkingLabel')}
          value={config.thinking ?? 'off'}
          disabled={!supportsThinkingToggle(id)}
          hint={supportsThinkingToggle(id) ? t('thinkingDesc') : t('thinkingUnsupported')}
          options={thinkingOptions(t('thinkingOff'))}
          onChange={(e) =>
            set({ thinking: (e.target as HTMLSelectElement).value as ThinkingSetting })
          }
        />
      </div>
    </div>
  );
}
