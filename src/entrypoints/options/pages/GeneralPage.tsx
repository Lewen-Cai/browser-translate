import { useRef, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Input } from '~/ui/components/Input';
import { HotkeyInput } from '~/ui/components/HotkeyInput';
import { Select } from '~/ui/components/Select';
import { Switch } from '~/ui/components/Switch';
import { Button } from '~/ui/components/Button';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { ResultBanner } from '~/ui/components/ResultBanner';
import { useT } from '~/i18n';
import { exportAppData, importAppData } from '~/storage/transfer';
import { clampSubtitleBackgroundOpacity, clampSubtitleFontScale } from '~/core/subtitles/layout';
import type { GlobalSettings } from '~/storage/schema';

const LANGUAGES = [
  { value: 'zh-CN', label: '简体中文 (zh-CN)' },
  { value: 'zh-TW', label: '繁體中文 (zh-TW)' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

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

export function GeneralPage() {
  const settings = useAppStore((s) => s.data.settings);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();

  const data = useAppStore((s) => s.data);
  const replaceAll = useAppStore((s) => s.replaceAll);
  const [includeKeys, setIncludeKeys] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const file = exportAppData(data, { includeKeys }, Date.now());
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'browsertranslate-settings.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleImportFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    try {
      const parsed: unknown = JSON.parse(await f.text());
      const next = importAppData(parsed);
      await replaceAll(next);
      setImportMsg({ ok: true, text: t('importSuccess') });
      setTimeout(() => setImportMsg(null), 4000);
    } catch (err) {
      setImportMsg({ ok: false, text: `${t('importFailed')}: ${(err as Error).message}` });
    } finally {
      input.value = ''; // allow re-importing the same file
    }
  }

  return (
    <div class="max-w-lg space-y-8">
      <div>
        <SectionHeader number="01" label={t('sectionTranslation').toUpperCase()} />
        <div class="space-y-4">
          <Select label={t('targetLanguage')}
            value={settings.targetLanguage} options={LANGUAGES}
            onChange={(e) => update({ targetLanguage: (e.target as HTMLSelectElement).value })}
          />
          <Select label={t('triggerMode')}
            value={settings.triggerMode}
            options={[
              { value: 'icon', label: t('iconAfterSelection') },
              { value: 'hotkey', label: t('hotkeyOnly') },
            ]}
            onChange={(e) => update({ triggerMode: (e.target as HTMLSelectElement).value as 'icon' | 'hotkey' })}
          />
          <div class="space-y-4">
            <span class="block text-2xs font-mono uppercase tracking-wider text-ap-muted">
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
        <SectionHeader number="02" label={t('sectionCache').toUpperCase()} />
        <div class="space-y-4">
          <Switch
            checked={settings.cacheEnabled}
            onChange={(v) => update({ cacheEnabled: v })}
            label={t('cacheTranslations')}
            description={t('cacheDesc')}
          />
          <Input label={t('cacheTtl')} type="number" min="1" max="365"
            value={String(settings.cacheTTLDays)} disabled={!settings.cacheEnabled} mono
            onInput={(e) => update({ cacheTTLDays: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 30) })}
          />
        </div>
      </div>

      <div>
        <SectionHeader number="03" label={t('sectionSubtitles').toUpperCase()} />
        <div class="space-y-4">
          <Select label={t('subtitleFontScale')}
            value={String(settings.subtitleFontScale)}
            options={[50, 75, 100, 125, 150, 200].map((v) => ({ value: String(v), label: `${v}%` }))}
            onChange={(e) => update({
              subtitleFontScale: clampSubtitleFontScale(Number((e.target as HTMLSelectElement).value)),
            })}
          />
          <Select label={t('subtitleBackgroundOpacity')}
            value={String(settings.subtitleBackgroundOpacity)}
            options={[0, 25, 50, 78, 100].map((v) => ({ value: String(v), label: `${v}%` }))}
            onChange={(e) => update({
              subtitleBackgroundOpacity: clampSubtitleBackgroundOpacity(
                Number((e.target as HTMLSelectElement).value),
              ),
            })}
          />
          <Switch
            checked={settings.subtitleTranslationOnly}
            onChange={(v) => update({ subtitleTranslationOnly: v })}
            label={t('subtitleTranslationOnly')}
            description={t('subtitleTranslationOnlyDesc')}
          />
        </div>
      </div>

      <div>
        <SectionHeader number="04" label={t('sectionAppearance').toUpperCase()} />
        <div class="space-y-4">
          <Select label={t('themeMode')}
            value={settings.theme}
            options={[
              { value: 'auto', label: t('themeAuto') },
              { value: 'light', label: t('themeLight') },
              { value: 'dark', label: t('themeDark') },
            ]}
            onChange={(e) => update({ theme: (e.target as HTMLSelectElement).value as 'auto' | 'light' | 'dark' })}
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

      <div>
        <SectionHeader number="05" label={t('sectionData').toUpperCase()} />
        <p class="text-xs text-ap-muted mb-4">{t('dataSectionDesc')}</p>
        <div class="space-y-4">
          <Switch
            checked={includeKeys}
            onChange={setIncludeKeys}
            label={t('includeApiKeys')}
            description={includeKeys ? t('includeApiKeysWarning') : undefined}
          />
          <div class="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>{t('exportSettings')}</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>{t('importSettings')}</Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            class="hidden"
            onChange={handleImportFile}
          />
          {importMsg && <ResultBanner ok={importMsg.ok} text={importMsg.text} />}
        </div>
      </div>
    </div>
  );
}
