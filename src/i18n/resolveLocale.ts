import { isLocale, type Locale } from './localeInfo';

/** Pure: resolve a uiLanguage setting + browser language into a concrete Locale. */
export function resolveLocale(setting: string, browserLang: string): Locale {
  if (isLocale(setting)) return setting;
  const b = (browserLang || '').toLowerCase();
  if (b.startsWith('zh')) {
    if (b.includes('tw') || b.includes('hk') || b.includes('hant')) return 'zh-TW';
    return 'zh-CN';
  }
  const base = b.split('-')[0];
  if (base === 'pt') return 'pt-BR';
  return isLocale(base) ? base : 'en';
}
