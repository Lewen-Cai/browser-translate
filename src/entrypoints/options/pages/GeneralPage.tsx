import { useAppStore } from '~/storage/store';
import { HotkeyInput } from '~/ui/components/HotkeyInput';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { EngineRoutingPicker } from '~/ui/components/EngineRoutingPicker';
import { useT } from '~/i18n';
import type { GlobalSettings } from '~/storage/schema';

const UI_LANGUAGES: { value: Exclude<GlobalSettings['uiLanguage'], 'auto'>; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

/** How translation is reached, and how the extension itself looks. */
export function GeneralPage() {
  const settings = useAppStore((s) => s.data.settings);
  const providers = useAppStore((s) => s.data.providers);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();

  return (
    <div class="max-w-lg space-y-8">
      {/* Which provider does what is a policy about behaviour, not part of
          configuring a provider — the Translation page holds the credentials,
          this decides where they get used. */}
      <div>
        <SectionHeader number="01" label={t('sectionRouting').toUpperCase()} />
        <EngineRoutingPicker
          engines={settings.engines}
          providers={providers}
          onChange={(next) => update({ engines: next })}
        />
      </div>

      <div>
        <SectionHeader number="02" label={t('sectionTrigger').toUpperCase()} />
        <div class="space-y-4">
          <Select label={t('triggerMode')}
            value={settings.triggerMode}
            options={[
              { value: 'icon', label: t('iconAfterSelection') },
              { value: 'hotkey', label: t('hotkeyOnly') },
            ]}
            onChange={(e) =>
              update({ triggerMode: (e.target as HTMLSelectElement).value as 'icon' | 'hotkey' })}
          />
          <div class="space-y-4">
            <span class="block text-xs font-mono uppercase tracking-wider text-ap-muted">
              {t('keyboardShortcuts')}
            </span>
            <HotkeyInput
              label={t('hotkey')}
              value={settings.hotkey}
              disabled={settings.triggerMode !== 'hotkey'}
              recordingLabel={t('pressShortcut')}
              onChange={(combo) => update({ hotkey: combo })}
            />
            <HotkeyInput
              label={t('fullPageHotkey')}
              value={settings.fullPageHotkey}
              disabled={settings.triggerMode !== 'hotkey'}
              hint={t('hotkeyHint')}
              recordingLabel={t('pressShortcut')}
              onChange={(combo) => update({ fullPageHotkey: combo })}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionHeader number="03" label={t('sectionAppearance').toUpperCase()} />
        <div class="space-y-4">
          <Select label={t('themeMode')}
            value={settings.theme}
            options={[
              { value: 'auto', label: t('themeAuto') },
              { value: 'light', label: t('themeLight') },
              { value: 'dark', label: t('themeDark') },
            ]}
            onChange={(e) =>
              update({ theme: (e.target as HTMLSelectElement).value as 'auto' | 'light' | 'dark' })}
          />
          <Select label={t('uiLanguage')}
            value={settings.uiLanguage}
            options={[
              { value: 'auto', label: t('uiLangAuto') },
              ...UI_LANGUAGES,
            ]}
            onChange={(e) =>
              update({
                uiLanguage: (e.target as HTMLSelectElement)
                  .value as GlobalSettings['uiLanguage'],
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
