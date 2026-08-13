import { useEffect } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { resolveEffectiveTheme } from './themeResolver';
import { resolveThemeDefinition } from '~/core/theme/themes';
import { applyThemeTokens } from './applyThemeTokens';

/**
 * Watches settings.theme/themeId/customThemes: toggles the `dark` class on
 * <html> and injects the active theme's token vars. 'auto' follows the system
 * color scheme via prefers-color-scheme.
 * Use this hook once per Preact root (popup, options).
 */
export function useApplyTheme(): void {
  const theme = useAppStore((s) => s.data.settings.theme);
  const themeId = useAppStore((s) => s.data.settings.themeId);
  const customThemes = useAppStore((s) => s.data.settings.customThemes);

  useEffect(() => {
    const root = document.documentElement;
    const definition = resolveThemeDefinition(themeId, customThemes ?? []);
    const apply = (isDark: boolean) => {
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
      applyThemeTokens(root, definition, isDark);
    };

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    apply(resolveEffectiveTheme(theme, mql.matches));

    if (theme !== 'auto') return;

    const onChange = (e: MediaQueryListEvent) => apply(resolveEffectiveTheme('auto', e.matches));
    mql.addEventListener('change', onChange);
    return () => {
      mql.removeEventListener('change', onChange);
    };
  }, [theme, themeId, customThemes]);
}
