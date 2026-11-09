import { useAppStore } from '~/storage/store';
import { HotkeyInput } from '~/ui/components/HotkeyInput';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { SegmentedControl } from '~/ui/components/SegmentedControl';
import { Shortcut } from '~/ui/components/Keycap';
import { Languages, Settings } from '~/ui/icons';
import { CARD_HEIGHT_CHOICES, CARD_WIDTH_CHOICES, normalizeCardSize, type CardSize } from '~/core/card/size';
import { useT } from '~/i18n';
import type { GlobalSettings } from '~/storage/schema';
import { UI_LANGUAGE_OPTIONS } from '~/i18n/localeInfo';

/**
 * Interface preferences, laid out like the Subtitles page: one preview of what
 * the settings add up to, then the settings themselves as plain rows.
 */
export function GeneralPage() {
  const settings = useAppStore((s) => s.data.settings);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();
  const size = settings.cardSize;
  const setSize = (patch: Partial<CardSize>) => update({ cardSize: normalizeCardSize({ ...size, ...patch }) });
  const hotkeyMode = settings.triggerMode === 'hotkey';

  return (
    <div class="space-y-5">
      <SectionHeader icon={Settings} label={t('subtitleGeneral')} />

      <GeneralPreview size={size} hotkey={hotkeyMode ? settings.hotkey : null} caption={t('subtitlePreview')} />

      <section class="ap-settings-panel">
        <div class="ap-subtitle-setting">
          <span class="text-sm">{t('uiLanguage')}</span>
          <div class="w-56 max-w-full">
            <Select aria-label={t('uiLanguage')} value={settings.uiLanguage}
              options={[{ value: 'auto', label: t('uiLangAuto') }, ...UI_LANGUAGE_OPTIONS]}
              onChange={(e) => update({ uiLanguage: e.currentTarget.value as GlobalSettings['uiLanguage'] })} />
          </div>
        </div>
        <div class="ap-subtitle-setting">
          <span class="text-sm">{t('themeMode')}</span>
          <SegmentedControl label={t('themeMode')} value={settings.theme}
            options={[{ value: 'light', label: t('themeLight') }, { value: 'dark', label: t('themeDark') },
              { value: 'auto', label: t('themeAuto') }]}
            onChange={(theme) => update({ theme })} />
        </div>
      </section>

      <section class="ap-settings-panel">
        <div class="ap-subtitle-setting">
          <span class="text-sm">{t('cardWidth')}</span>
          <SegmentedControl label={t('cardWidth')} value={String(size.width)}
            options={CARD_WIDTH_CHOICES.map((v) => ({ value: String(v), label: String(v) }))}
            onChange={(v) => setSize({ width: Number(v) })} />
        </div>
        <div class="ap-subtitle-setting">
          <span class="text-sm">{t('cardHeight')}</span>
          <SegmentedControl label={t('cardHeight')} value={String(size.height)}
            options={CARD_HEIGHT_CHOICES.map((v) => ({ value: String(v), label: String(v) }))}
            onChange={(v) => setSize({ height: Number(v) })} />
        </div>
        <div class="ap-subtitle-setting">
          <span class="text-sm">{t('triggerMode')}</span>
          <div class="w-56 max-w-full">
            <Select aria-label={t('triggerMode')} value={settings.triggerMode}
              options={[{ value: 'icon', label: t('iconAfterSelection') }, { value: 'hotkey', label: t('hotkeyOnly') }]}
              onChange={(e) => update({ triggerMode: e.currentTarget.value as GlobalSettings['triggerMode'] })} />
          </div>
        </div>
        {/* Both shortcuts only work in hotkey mode, so they appear with it
            rather than sitting there greyed out the rest of the time. */}
        {hotkeyMode && <>
          <HotkeyInput inline label={t('hotkey')} value={settings.hotkey}
            recordingLabel={t('pressShortcut')} onChange={(hotkey) => update({ hotkey })} />
          <HotkeyInput inline label={t('fullPageHotkey')} value={settings.fullPageHotkey}
            recordingLabel={t('pressShortcut')} onChange={(fullPageHotkey) => update({ fullPageHotkey })} />
        </>}
      </section>
    </div>
  );
}

/** Scale of the card in the preview against the real card. */
const SCALE = 0.4;

/**
 * A page with a selection, and what happens next under the current settings:
 * the trigger icon (or the shortcut, in hotkey mode) and the card at its real
 * proportions. It is drawn in the page's own colours, so the theme choice shows
 * here too.
 */
function GeneralPreview({ size, hotkey, caption }: { size: CardSize; hotkey: string | null; caption: string }) {
  const w = Math.round(size.width * SCALE);
  const h = Math.round(size.height * SCALE);
  const lines = [94, 88, 96, 72, 90, 84, 92, 66, 89, 80, 93, 70, 86, 62];
  return (
    <figure aria-label={caption} class="relative m-0 h-[280px] overflow-hidden rounded-xl border border-ap-border bg-ap-surface">
      <figcaption class="absolute left-3.5 top-3 z-10 rounded-[5px] bg-ap-bg/90 px-2 py-0.5 text-[11px] text-ap-muted">{caption}</figcaption>
      <div class="space-y-[11px] px-8 pt-12">
        {lines.map((pct, i) => (
          <div key={i} class="relative h-[5px] rounded-full bg-ap-fg/10" style={{ width: `${pct}%` }}>
            {i === 1 && (
              <span class="absolute left-[14%] top-[-4px] h-[13px] w-[30%] rounded-sm bg-ap-brand/25">
                {hotkey
                  ? <span class="absolute -top-7 right-0"><Shortcut combo={hotkey} /></span>
                  : <span class="absolute -right-2 -top-6 flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-ap-brand text-white shadow">
                      <Languages size={12} />
                    </span>}
              </span>
            )}
          </div>
        ))}
      </div>
      <div
        class="absolute top-[78px] flex flex-col overflow-hidden rounded-lg border border-ap-border-strong bg-ap-surface shadow-xl transition-all duration-300"
        style={{ left: 'calc(32px + 13%)', width: `${w}px`, height: `${h}px` }}
      >
        <div class="flex h-6 shrink-0 items-center gap-1.5 border-b border-ap-border px-2.5">
          <span class="h-1.5 w-1.5 rounded-full bg-ap-brand" />
          <span class="h-1 w-12 rounded-full bg-ap-fg/15" />
        </div>
        <div class="min-h-0 flex-1 space-y-2 p-2.5">
          <div class="h-1 w-11/12 rounded-full bg-ap-fg/20" />
          <div class="h-1 w-4/5 rounded-full bg-ap-fg/20" />
          <div class="h-1 w-3/5 rounded-full bg-ap-fg/20" />
        </div>
        <div class="flex h-6 shrink-0 items-center justify-center border-t border-ap-border font-mono text-[10px] text-ap-muted">
          {size.width} × {size.height}
        </div>
      </div>
    </figure>
  );
}
