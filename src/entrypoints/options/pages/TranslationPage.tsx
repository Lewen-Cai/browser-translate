import { useAppStore } from '~/storage/store';
import { Input } from '~/ui/components/Input';
import { Switch } from '~/ui/components/Switch';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { useT } from '~/i18n';
import { ProvidersPanel } from './ProvidersPanel';
import { TARGET_LANGUAGE_OPTIONS } from '~/core/language/targets';

/** Target language, the providers themselves, and how long results are kept. */
export function TranslationPage() {
  const targetLanguage = useAppStore((s) => s.data.settings.targetLanguage);
  const cacheEnabled = useAppStore((s) => s.data.settings.cacheEnabled);
  const cacheTTLDays = useAppStore((s) => s.data.settings.cacheTTLDays);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const t = useT();

  return (
    <div class="max-w-lg">
      <SectionHeader number="01" label={t('sectionTranslation').toUpperCase()} />
      <div class="space-y-4">
        <Select
          label={t('targetLanguage')}
          value={targetLanguage}
          options={TARGET_LANGUAGE_OPTIONS}
          onChange={(e) =>
            updateSettings({ targetLanguage: (e.target as HTMLSelectElement).value })
          }
        />
      </div>

      {/* Every provider is listed whether or not anything routes to it: this is
          where one is set up, and Routing (General) decides what uses it. */}
      <div class="mt-8">
        <SectionHeader
          number="02"
          label={t('sectionProviders').toUpperCase()}
          description={t('openaiCompatible')}
        />
      </div>
      <ProvidersPanel />

      <div class="mt-8">
        <SectionHeader number="03" label={t('sectionCache').toUpperCase()} />
        <div class="space-y-4">
          <Switch
            checked={cacheEnabled}
            onChange={(v) => updateSettings({ cacheEnabled: v })}
            label={t('cacheTranslations')}
            description={t('cacheDesc')}
          />
          <Input
            label={t('cacheTtl')}
            type="number"
            min="1"
            max="365"
            value={String(cacheTTLDays)}
            disabled={!cacheEnabled}
            mono
            onInput={(e) =>
              updateSettings({
                cacheTTLDays: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 30),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
