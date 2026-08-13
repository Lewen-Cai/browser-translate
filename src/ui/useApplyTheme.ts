import { useEffect } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { resolveEffectiveTheme } from './themeResolver';

/**
 * Toggles the `dark` class on <html> from settings.theme; 'auto' follows the
 * system colour scheme. Call once per Preact root (popup, options).
 */
export function useApplyTheme(): void {
  const theme = useAppStore((s) => s.data.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (isDark: boolean) => {
      root.classList.toggle('dark', isDark);
    };

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    apply(resolveEffectiveTheme(theme, mql.matches));
    if (theme !== 'auto') return;

    const onChange = (e: MediaQueryListEvent) => apply(resolveEffectiveTheme('auto', e.matches));
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);
}
