import { useEffect, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Input } from '~/ui/components/Input';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { SegmentedControl } from '~/ui/components/SegmentedControl';
import { ApiStatusIndicator } from '~/ui/components/ApiStatusIndicator';
import { Eye, EyeOff } from '~/ui/icons';
import { useT } from '~/i18n';
import { CLOUD_PRESETS, baseUrlHint, supportsThinkingToggle, type CloudProvider } from '~/core/providers/presets';
import { activeSlot, applySlot, rememberActive } from '~/core/providers/providerSlots';
import { thinkingOptions } from '~/ui/thinkingOptions';
import type { ThinkingSetting } from '~/storage/schema';

export function ApiSettingsPage() {
  const api = useAppStore((s) => s.data.api);
  const updateApi = useAppStore((s) => s.updateApi);
  const [showKey, setShowKey] = useState(false);
  const t = useT();

  // Debounced re-ping: 1500ms idle after any meaningful API field edit.
  const [pingNonce, setPingNonce] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setPingNonce((n) => n + 1), 1500);
    return () => clearTimeout(id);
  }, [api.baseUrl, api.apiKey, api.model, api.providerType, api.cloudProvider]);

  const isCloud = api.providerType === 'cloud';
  const baseUrlLocked = isCloud && api.cloudProvider !== 'custom';

  function onProviderTypeChange(next: 'cloud' | 'local') {
    updateApi(applySlot(rememberActive(api), next === 'local' ? 'local' : api.cloudProvider));
  }

  function onCloudProviderChange(next: CloudProvider) {
    updateApi(applySlot(rememberActive(api), next));
  }

  return (
    <div class="max-w-lg">
      <SectionHeader number="01" label={t('sectionApiEndpoint').toUpperCase()} description={t('openaiCompatible')} />
      <div class="space-y-4">
        <SegmentedControl<'cloud' | 'local'>
          label={t('providerType')}
          value={api.providerType}
          fullWidth
          options={[
            { value: 'cloud', label: t('providerTypeCloud') },
            { value: 'local', label: t('providerTypeLocal') },
          ]}
          onChange={onProviderTypeChange}
        />

        {isCloud && (
          <Select
            label={t('cloudProvider')}
            value={api.cloudProvider}
            options={(Object.keys(CLOUD_PRESETS) as CloudProvider[]).map((k) => ({
              value: k,
              label: k === 'custom' ? t('cloudProviderCustom') : CLOUD_PRESETS[k].label,
            }))}
            onChange={(e) => onCloudProviderChange((e.target as HTMLSelectElement).value as CloudProvider)}
          />
        )}

        {isCloud && CLOUD_PRESETS[api.cloudProvider].endpoints.length > 1 && (
          <Select
            label={t('cloudEndpoint')}
            value={api.baseUrl}
            options={CLOUD_PRESETS[api.cloudProvider].endpoints.map((ep) => ({
              value: ep.baseUrl,
              label: ep.label,
            }))}
            onChange={(e) => updateApi(rememberActive({ ...api, baseUrl: (e.target as HTMLSelectElement).value }))}
          />
        )}

        <Input
          label={t('baseUrl')}
          value={api.baseUrl}
          disabled={baseUrlLocked}
          mono
          hint={baseUrlHint(api.providerType)}
          onInput={(e) => updateApi(rememberActive({ ...api, baseUrl: (e.target as HTMLInputElement).value }))}
        />

        {isCloud && (
          <div class="flex gap-2 items-end">
            <div class="flex-1">
              <Input
                label={t('apiKey')}
                type={showKey ? 'text' : 'password'}
                value={api.apiKey}
                mono
                onInput={(e) => updateApi(rememberActive({ ...api, apiKey: (e.target as HTMLInputElement).value }))}
              />
            </div>
            <button
              onClick={() => setShowKey((s) => !s)}
              class="h-8 w-8 flex items-center justify-center rounded-md border border-ap-border bg-ap-surface text-ap-muted hover:text-ap-fg hover:border-ap-border-strong transition-colors"
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        )}

        <Input
          label={t('model')}
          value={api.model}
          mono
          onInput={(e) => updateApi(rememberActive({ ...api, model: (e.target as HTMLInputElement).value }))}
        />

        <Select
          label={t('thinkingLabel')}
          value={api.thinking ?? 'off'}
          disabled={!supportsThinkingToggle(activeSlot(api))}
          hint={supportsThinkingToggle(activeSlot(api)) ? t('thinkingDesc') : t('thinkingUnsupported')}
          options={thinkingOptions(t('thinkingOff'))}
          onChange={(e) =>
            updateApi(rememberActive({ ...api, thinking: (e.target as HTMLSelectElement).value as ThinkingSetting }))
          }
        />

        <div class="pt-1">
          <ApiStatusIndicator pingNonce={pingNonce} />
        </div>
      </div>
    </div>
  );
}
