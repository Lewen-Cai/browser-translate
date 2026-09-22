import { useAppStore } from '~/storage/store';
import { HotkeyInput } from '~/ui/components/HotkeyInput';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { CARD_HEIGHT_CHOICES, CARD_WIDTH_CHOICES, normalizeCardSize } from '~/core/card/size';
import { useT } from '~/i18n';
import type { GlobalSettings } from '~/storage/schema';
import { UI_LANGUAGE_OPTIONS } from '~/i18n/localeInfo';

export function GeneralPage() {
  const settings = useAppStore((s) => s.data.settings);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();
  return (
    <div class="space-y-5">
      <section class="ap-settings-panel">
        <SectionHeader label={t('sectionAppearance')} />
        <Select inline label={t('uiLanguage')} value={settings.uiLanguage}
          options={[{ value: 'auto', label: t('uiLangAuto') }, ...UI_LANGUAGE_OPTIONS]}
          onChange={(e) => update({ uiLanguage: e.currentTarget.value as GlobalSettings['uiLanguage'] })} />
        <Select inline label={t('themeMode')} value={settings.theme}
          options={[{ value: 'auto', label: t('themeAuto') }, { value: 'light', label: t('themeLight') }, { value: 'dark', label: t('themeDark') }]}
          onChange={(e) => update({ theme: e.currentTarget.value as GlobalSettings['theme'] })} />
        <Select inline label={t('cardWidth')} value={String(settings.cardSize.width)}
          options={CARD_WIDTH_CHOICES.map((v) => ({ value: String(v), label: `${v} px` }))}
          onChange={(e) => update({ cardSize: normalizeCardSize({ ...settings.cardSize, width: Number(e.currentTarget.value) }) })} />
        <Select inline label={t('cardHeight')} value={String(settings.cardSize.height)}
          options={CARD_HEIGHT_CHOICES.map((v) => ({ value: String(v), label: `${v} px` }))}
          onChange={(e) => update({ cardSize: normalizeCardSize({ ...settings.cardSize, height: Number(e.currentTarget.value) }) })} />
      </section>
      <section class="ap-settings-panel">
        <SectionHeader label={t('sectionTrigger')} />
        <Select inline label={t('triggerMode')} value={settings.triggerMode}
          options={[{ value: 'icon', label: t('iconAfterSelection') }, { value: 'hotkey', label: t('hotkeyOnly') }]}
          onChange={(e) => update({ triggerMode: e.currentTarget.value as GlobalSettings['triggerMode'] })} />
        <HotkeyInput inline label={t('hotkey')} value={settings.hotkey} disabled={settings.triggerMode !== 'hotkey'}
          recordingLabel={t('pressShortcut')} onChange={(hotkey) => update({ hotkey })} />
        <HotkeyInput inline label={t('fullPageHotkey')} value={settings.fullPageHotkey} disabled={settings.triggerMode !== 'hotkey'}
          recordingLabel={t('pressShortcut')} onChange={(fullPageHotkey) => update({ fullPageHotkey })} />
        <p class="mt-1 text-xs leading-relaxed text-ap-muted">{t('hotkeyHint')}</p>
      </section>
    </div>
  );
}
