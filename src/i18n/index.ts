import { useAppStore } from '~/storage/store';
import { MESSAGES, type Locale, type StringKey } from './strings';
import { resolveLocale } from './resolveLocale';

export { resolveLocale };

function currentBrowserLang(): string {
  return typeof navigator !== 'undefined' ? navigator.language : 'en';
}

export function useLocale(): Locale {
  const uiLang = useAppStore((s) => s.data.settings.uiLanguage);
  return resolveLocale(uiLang, currentBrowserLang());
}

export function useT(): (key: StringKey) => string {
  const locale = useLocale();
  return (key: StringKey) => MESSAGES[locale][key];
}

// For non-React contexts (e.g. background script)
export function t(key: StringKey, locale: Locale = 'en'): string {
  return MESSAGES[locale][key];
}
