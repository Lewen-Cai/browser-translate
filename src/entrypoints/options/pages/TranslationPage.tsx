import { useAppStore } from '~/storage/store';
import { LanguageSelect } from '~/ui/components/LanguageSelect';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { EngineRoutingPicker } from '~/ui/components/EngineRoutingPicker';
import { useT } from '~/i18n';
import { PromptPanel } from './PromptPanel';

/** Translation policy, separate from credentials and interface preferences. */
export function TranslationPage() {
  const settings = useAppStore((s) => s.data.settings);
  const providers = useAppStore((s) => s.data.providers);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();
  return (
    <div class="space-y-5">
      <section class="ap-settings-panel">
        <LanguageSelect value={settings.targetLanguage} onChange={(value) => update({ targetLanguage: value })} />
      </section>
      <section class="ap-settings-panel">
        <SectionHeader label={t('sectionRouting')} />
        <EngineRoutingPicker engines={settings.engines} providers={providers}
          onChange={(engines) => update({ engines })} />
      </section>
      <section>
        <div class="flex items-baseline justify-between gap-3">
          <SectionHeader label={t('sectionPrompts')} />
          <span class="rounded-full border border-ap-border px-2 py-0.5 text-xs text-ap-muted">{t('promptLlmOnly')}</span>
        </div>
        <PromptPanel settings={settings.prompts} onChange={(prompts) => update({ prompts })} />
      </section>
    </div>
  );
}
