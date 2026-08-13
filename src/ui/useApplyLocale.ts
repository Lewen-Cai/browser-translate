import { useEffect } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { resolveLocale } from '~/i18n';

/**
 * Writes the resolved interface language to `<html lang>`.
 *
 * Two things read it. Our own stylesheet picks the CJK font stack from it,
 * because Han characters are drawn differently in Chinese, Japanese and Korean
 * and one stack cannot serve all three. The browser reads it as well, to decide
 * what the generic `serif` and `sans-serif` families mean — which is what makes
 * the fallback correct even for a reader who has none of the named fonts.
 *
 * Call once per Preact root (popup, options).
 */
export function useApplyLocale(): void {
  const uiLanguage = useAppStore((s) => s.data.settings.uiLanguage);

  useEffect(() => {
    document.documentElement.lang = resolveLocale(uiLanguage, navigator.language);
  }, [uiLanguage]);
}
