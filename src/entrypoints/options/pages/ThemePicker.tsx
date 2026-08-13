import { useRef, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { useT } from '~/i18n';
import { BUILT_IN_THEMES, parseCustomTheme } from '~/core/theme/themes';
import { Trash2, Upload } from '~/ui/icons';
import { Button } from '~/ui/components/Button';
import { ResultBanner } from '~/ui/components/ResultBanner';
import { cn } from '~/lib/cn';
import type { ThemeDefinition, ThemePalette } from '~/storage/schema';

function SwatchDots({ palette }: { palette: ThemePalette }) {
  const dot = (value: string, bordered = false) => (
    <span
      class={cn('inline-block h-3 w-3 rounded-full', bordered && 'border border-ap-border-strong')}
      style={{ background: `rgb(${value})` }}
    />
  );
  return (
    <span class="flex items-center gap-1">
      {dot(palette.brand)}
      {dot(palette.bg, true)}
      {dot(palette.fg)}
    </span>
  );
}

export function ThemePicker() {
  const settings = useAppStore((s) => s.data.settings);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Swatches preview the variant currently in effect (useApplyTheme keeps
  // the .dark class on <html> in sync before this renders).
  const isDark = document.documentElement.classList.contains('dark');
  const themes: ThemeDefinition[] = [...BUILT_IN_THEMES, ...settings.customThemes];

  function deleteCustom(id: string) {
    const customThemes = settings.customThemes.filter((theme) => theme.id !== id);
    void update({ customThemes, ...(settings.themeId === id && { themeId: 'cobalt' }) });
  }

  async function handleUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    try {
      const theme = parseCustomTheme(JSON.parse(await f.text()) as unknown);
      await update({ customThemes: [...settings.customThemes, theme], themeId: theme.id });
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(`${t('invalidThemeFile')}: ${(err as Error).message}`);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      input.value = ''; // allow re-picking the same file
    }
  }

  return (
    <div>
      <span class="block text-2xs font-mono uppercase tracking-wider text-ap-muted mb-2">
        {t('colorTheme')}
      </span>
      <div class="grid grid-cols-2 gap-2">
        {themes.map((theme) => {
          const selected = settings.themeId === theme.id;
          const custom = !BUILT_IN_THEMES.some((b) => b.id === theme.id);
          return (
            <div
              key={theme.id}
              class={cn(
                'group relative flex items-center gap-2.5 rounded-md border px-3 py-2.5 transition-colors',
                selected
                  ? 'border-ap-brand bg-ap-surface'
                  : 'border-ap-border bg-ap-surface hover:border-ap-border-strong',
              )}
            >
              <button
                type="button"
                class="absolute inset-0"
                aria-pressed={selected}
                onClick={() => void update({ themeId: theme.id })}
              />
              <SwatchDots palette={isDark ? theme.colors.dark : theme.colors.light} />
              <span
                class={cn('flex-1 truncate text-xs', selected ? 'text-ap-fg' : 'text-ap-muted')}
                style={{ fontFamily: theme.fonts.sans }}
              >
                {theme.name}
              </span>
              {custom && (
                <button
                  type="button"
                  title={t('delete')}
                  onClick={() => deleteCustom(theme.id)}
                  class="relative z-10 hidden h-6 w-6 items-center justify-center rounded text-ap-subtle transition-colors hover:text-ap-danger group-hover:flex"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div class="mt-3">
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <span class="flex items-center gap-1.5">
            <Upload size={12} />
            {t('uploadTheme')}
          </span>
        </Button>
        <input ref={fileRef} type="file" accept="application/json" class="hidden" onChange={handleUpload} />
      </div>
      {errorMsg && (
        <div class="mt-2">
          <ResultBanner ok={false} text={errorMsg} />
        </div>
      )}
    </div>
  );
}
