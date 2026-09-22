import { TARGET_LANGUAGES, type TargetLanguage } from './targets';

export interface LanguageChoice extends TargetLanguage {
  localized: string;
  searchText: string;
}

const ALIASES: Record<string, string> = {
  'en-US': 'US USA American 美式 美语 美国英语 英文',
  'en-GB': 'UK GB British 英式 英国英语',
  'en-AU': 'AU Australian 澳式 澳洲 澳大利亚英语',
};

/** Fold accents for Latin keyboards, but do not strip combining marks from other scripts. */
export function foldSearch(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/([a-z])\p{M}+/gu, '$1').normalize('NFC');
}

export function languageChoices(locale: string): LanguageChoice[] {
  const names = new Intl.DisplayNames([locale], { type: 'language' });
  return TARGET_LANGUAGES.map((language) => {
    // Asking Intl for zh-Hans/zh-Hant yields the script names. The stored
    // codes stay as they are, so saved settings keep working.
    const displayCode = language.code === 'zh-CN' ? 'zh-Hans'
      : language.code === 'zh-TW' ? 'zh-Hant' : language.code;
    const localized = locale.startsWith('en') ? language.english
      : names.of(displayCode) ?? language.english;
    return {
      ...language,
      localized,
      searchText: foldSearch(`${language.code} ${language.endonym} ${language.english} ${localized} ${ALIASES[language.code] ?? ''}`),
    };
  });
}

export function filterLanguages(choices: LanguageChoice[], query: string): LanguageChoice[] {
  const parts = foldSearch(query).trim().split(/\s+/).filter(Boolean);
  return choices.filter((choice) => parts.every((part) => choice.searchText.includes(part)));
}
