import { useEffect, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Input } from '~/ui/components/Input';
import { Switch } from '~/ui/components/Switch';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { SegmentedControl } from '~/ui/components/SegmentedControl';
import { ApiStatusIndicator } from '~/ui/components/ApiStatusIndicator';
import { Eye, EyeOff } from '~/ui/icons';
import { useT } from '~/i18n';
import {
  CLOUD_PRESETS,
  baseUrlHint,
  supportsThinkingToggle,
  type CloudProvider,
} from '~/core/providers/presets';
import { activeSlot, applySlot, rememberActive } from '~/core/providers/providerSlots';
import { thinkingOptions } from '~/ui/thinkingOptions';
import { EnginePicker } from '~/ui/components/EnginePicker';
import { ProviderSelect } from '~/ui/components/ProviderSelect';
import { TARGET_LANGUAGE_OPTIONS } from '~/core/language/targets';
import type { ThinkingSetting } from '~/storage/schema';

export function TranslationPage() {
  const api = useAppStore((s) => s.data.api);
  const engine = useAppStore((s) => s.data.settings.engine);
  const targetLanguage = useAppStore((s) => s.data.settings.targetLanguage);
  const cacheEnabled = useAppStore((s) => s.data.settings.cacheEnabled);
  const cacheTTLDays = useAppStore((s) => s.data.settings.cacheTTLDays);
  const updateApi = useAppStore((s) => s.updateApi);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [showKey, setShowKey] = useState(false);
  const t = useT();

  // Debounced re-ping: 1500ms idle after any meaningful API field edit.
  const [pingNonce, setPingNonce] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setPingNonce((n) => n + 1), 1500);
    return () => clearTimeout(id);
  }, [api.baseUrl, api.apiKey, api.model, api.providerType, api.cloudProvider, engine]);

  const isCloud = api.providerType === 'cloud';
  const usesApi = engine === 'llm';
  const baseUrlLocked = isCloud && api.cloudProvider !== 'custom';

  function onProviderTypeChange(next: 'cloud' | 'local') {
    updateApi(applySlot(rememberActive(api), next === 'local' ? 'local' : api.cloudProvider));
  }

  function onCloudProviderChange(next: CloudProvider) {
    updateApi(applySlot(rememberActive(api), next));
  }

  return (
    <div class="max-w-lg">
      <SectionHeader number="01" label={t('sectionTranslation').toUpperCase()} />
      <div class="space-y-4">
        <Select label={t('targetLanguage')}
          value={targetLanguage} options={TARGET_LANGUAGE_OPTIONS}
          onChange={(e) =>
            updateSettings({ targetLanguage: (e.target as HTMLSelectElement).value })}
        />
      </div>

      <div class="mt-8">
        <SectionHeader number="02" label={t('engine').toUpperCase()} />
      </div>
      <EnginePicker value={engine} onChange={(next) => updateSettings({ engine: next })} />

      {!usesApi ? null : (
        <>
          <div class="mt-8">
            <SectionHeader
              number="03"
              label={t('sectionApiEndpoint').toUpperCase()}
              description={t('openaiCompatible')}
            />
          </div>
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
              <ProviderSelect
                label={t('cloudProvider')}
                value={api.cloudProvider}
                options={(Object.keys(CLOUD_PRESETS) as CloudProvider[]).map((k) => ({
                  value: k,
                  label: k === 'custom' ? t('cloudProviderCustom') : CLOUD_PRESETS[k].label,
                  iconId: k,
                }))}
                onChange={(next) => onCloudProviderChange(next as CloudProvider)}
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
                onChange={(e) =>
                  updateApi(
                    rememberActive({ ...api, baseUrl: (e.target as HTMLSelectElement).value }),
                  )
                }
              />
            )}

            <Input
              label={t('baseUrl')}
              value={api.baseUrl}
              disabled={baseUrlLocked}
              mono
              hint={baseUrlHint(api.providerType)}
              onInput={(e) =>
                updateApi(rememberActive({ ...api, baseUrl: (e.target as HTMLInputElement).value }))
              }
            />

            {isCloud && (
              <div class="flex gap-2 items-end">
                <div class="flex-1">
                  <Input
                    label={t('apiKey')}
                    type={showKey ? 'text' : 'password'}
                    value={api.apiKey}
                    mono
                    onInput={(e) =>
                      updateApi(
                        rememberActive({ ...api, apiKey: (e.target as HTMLInputElement).value }),
                      )
                    }
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
              onInput={(e) =>
                updateApi(rememberActive({ ...api, model: (e.target as HTMLInputElement).value }))
              }
            />

            <Select
              label={t('thinkingLabel')}
              value={api.thinking ?? 'off'}
              disabled={!supportsThinkingToggle(activeSlot(api))}
              hint={
                supportsThinkingToggle(activeSlot(api))
                  ? t('thinkingDesc')
                  : t('thinkingUnsupported')
              }
              options={thinkingOptions(t('thinkingOff'))}
              onChange={(e) =>
                updateApi(
                  rememberActive({
                    ...api,
                    thinking: (e.target as HTMLSelectElement).value as ThinkingSetting,
                  }),
                )
              }
            />
          </div>
        </>
      )}

      <div class="mt-6">
        <ApiStatusIndicator pingNonce={pingNonce} />
      </div>

      <div class="mt-8">
        <SectionHeader number={usesApi ? '04' : '03'} label={t('sectionCache').toUpperCase()} />
        <div class="space-y-4">
          <Switch
            checked={cacheEnabled}
            onChange={(v) => updateSettings({ cacheEnabled: v })}
            label={t('cacheTranslations')}
            description={t('cacheDesc')}
          />
          <Input label={t('cacheTtl')} type="number" min="1" max="365"
            value={String(cacheTTLDays)} disabled={!cacheEnabled} mono
            onInput={(e) => updateSettings({
              cacheTTLDays: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 30),
            })}
          />
        </div>
      </div>
    </div>
  );
}
