import { useAppStore } from '~/storage/store';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { useT } from '~/i18n';
import {
  SUBTITLE_FONT_FAMILY_IDS,
  clampSubtitleBackgroundOpacity,
  clampSubtitleFontScale,
  clampSubtitleFontWeight,
  type SubtitleDisplayMode,
  type SubtitleFontFamily,
  type SubtitleStyle,
  type SubtitleTextStyle,
  type SubtitleTranslationPosition,
} from '~/core/subtitles/style';

/** Font stacks are named after the face, not translated. */
const SUBTITLE_FONT_LABELS: Record<SubtitleFontFamily, string> = {
  youtube: 'YouTube',
  sans: 'Noto Sans',
  serif: 'Source Han Serif',
};

function TextStyleFields({ label, value, onChange }: {
  label: string;
  value: SubtitleTextStyle;
  onChange: (patch: Partial<SubtitleTextStyle>) => void;
}) {
  const t = useT();
  return (
    <div class="rounded-md border border-ap-border p-3 space-y-3">
      <span class="block text-xs font-mono uppercase tracking-wider text-ap-muted">{label}</span>
      <div class="grid grid-cols-2 gap-3">
        <Select label={t('subtitleFontScale')}
          value={String(value.fontScale)}
          options={[50, 75, 100, 125, 150, 200].map((v) => ({ value: String(v), label: `${v}%` }))}
          onChange={(e) => onChange({
            fontScale: clampSubtitleFontScale(Number((e.target as HTMLSelectElement).value)),
          })}
        />
        <Select label={t('subtitleFontWeight')}
          value={String(value.fontWeight)}
          options={[300, 400, 500, 600, 700].map((v) => ({ value: String(v), label: String(v) }))}
          onChange={(e) => onChange({
            fontWeight: clampSubtitleFontWeight(Number((e.target as HTMLSelectElement).value)),
          })}
        />
        <Select label={t('subtitleFontFamily')}
          value={value.fontFamily}
          options={SUBTITLE_FONT_FAMILY_IDS.map((id) => ({
            value: id, label: SUBTITLE_FONT_LABELS[id],
          }))}
          onChange={(e) => onChange({
            fontFamily: (e.target as HTMLSelectElement).value as SubtitleFontFamily,
          })}
        />
        <label class="block">
          <span class="block text-xs font-mono uppercase tracking-wider text-ap-muted mb-1">
            {t('subtitleColor')}
          </span>
          <input type="color" value={value.color}
            class="h-8 w-full rounded-md border border-ap-border bg-ap-surface p-1 cursor-pointer"
            onChange={(e) => onChange({ color: (e.target as HTMLInputElement).value })}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Everything about subtitles on video. The same settings are reachable from the
 * menu on the player itself — this page is for setting them up once, that one
 * for adjusting them against a video you are actually watching.
 */
export function VideoPage() {
  const style = useAppStore((s) => s.data.settings.subtitleStyle);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();
  const patchStyle = (patch: Partial<SubtitleStyle>) =>
    update({ subtitleStyle: { ...style, ...patch } });

  return (
    <div class="max-w-lg space-y-8">
      <div>
        <SectionHeader number="01" label={t('sectionSubtitles').toUpperCase()} />
        <div class="space-y-4">
          <Select label={t('subtitleDisplayMode')}
            value={style.displayMode}
            options={[
              { value: 'bilingual', label: t('subtitleDisplayBilingual') },
              { value: 'originalOnly', label: t('subtitleDisplayOriginalOnly') },
              { value: 'translationOnly', label: t('subtitleDisplayTranslationOnly') },
            ]}
            onChange={(e) => patchStyle({
              displayMode: (e.target as HTMLSelectElement).value as SubtitleDisplayMode,
            })}
          />
          {/* Which line goes on top only means something when both are drawn. */}
          {style.displayMode === 'bilingual' && (
            <Select label={t('subtitleTranslationPosition')}
              value={style.translationPosition}
              options={[
                { value: 'above', label: t('subtitlePositionAbove') },
                { value: 'below', label: t('subtitlePositionBelow') },
              ]}
              onChange={(e) => patchStyle({
                translationPosition:
                  (e.target as HTMLSelectElement).value as SubtitleTranslationPosition,
              })}
            />
          )}
          <Select label={t('subtitleBackgroundOpacity')}
            value={String(style.backgroundOpacity)}
            options={[0, 25, 50, 78, 100].map((v) => ({ value: String(v), label: `${v}%` }))}
            onChange={(e) => patchStyle({
              backgroundOpacity: clampSubtitleBackgroundOpacity(
                Number((e.target as HTMLSelectElement).value),
              ),
            })}
          />
          <TextStyleFields
            label={t('subtitleMainLine')}
            value={style.main}
            onChange={(patch) => patchStyle({ main: { ...style.main, ...patch } })}
          />
          <TextStyleFields
            label={t('subtitleTranslationLine')}
            value={style.translation}
            onChange={(patch) => patchStyle({ translation: { ...style.translation, ...patch } })}
          />
        </div>
      </div>
    </div>
  );
}
