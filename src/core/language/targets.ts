/**
 * The languages we translate INTO.
 *
 * Deliberately not the interface locales from `~/i18n`. Interface
 * languages require complete string tables; translation targets are independent
 * and use engine-specific codes. Tying the two lists together capped the target list at eight
 * for no reason, so they are separate now.
 *
 * Base languages have been smoke-tested against both free endpoints with
 * synthetic text. English variants are primarily LLM instructions: unsupported
 * service variants intentionally fall back to generic English without a warning.
 * Notes from that pass:
 *
 * - Hebrew is `he`. Google also accepts the legacy `iw`, Microsoft returns 400
 *   for it, so `iw` is not offered.
 * - `pt-PT` is honoured by both engines and really does differ from `pt`
 *   ("redes de computadores" vs "rede de computadores"), so it needs an entry
 *   in the engine code map — the generic "strip the region" fallback would
 *   quietly serve Brazilian Portuguese instead. `pt-BR` needs no such entry:
 *   both engines read plain `pt` as Brazilian already.
 * - Norwegian is `nb`. Both engines accept `no` too and normalise it to `nb`.
 */
export interface TargetLanguage {
  /** Stored in settings, mapped per engine, and part of every cache key. */
  code: string;
  /** The language's own name — what the picker shows. */
  endonym: string;
  /**
   * English name. LLM prompts use this: a bare code like `nb` reads as noise to
   * a model, while "Norwegian Bokmål" is unambiguous.
   */
  english: string;
}

/** Ordered by English name, which is the only order that is stable across scripts. */
export const TARGET_LANGUAGES: readonly TargetLanguage[] = [
  { code: 'ar', endonym: 'العربية', english: 'Arabic' },
  { code: 'bn', endonym: 'বাংলা', english: 'Bengali' },
  { code: 'bg', endonym: 'Български', english: 'Bulgarian' },
  { code: 'ca', endonym: 'Català', english: 'Catalan' },
  { code: 'zh-CN', endonym: '简体中文', english: 'Chinese (Simplified)' },
  { code: 'zh-TW', endonym: '繁體中文', english: 'Chinese (Traditional)' },
  { code: 'hr', endonym: 'Hrvatski', english: 'Croatian' },
  { code: 'cs', endonym: 'Čeština', english: 'Czech' },
  { code: 'da', endonym: 'Dansk', english: 'Danish' },
  { code: 'nl', endonym: 'Nederlands', english: 'Dutch' },
  { code: 'en-AU', endonym: 'English (Australia)', english: 'English (Australia)' },
  { code: 'en-GB', endonym: 'English (United Kingdom)', english: 'English (United Kingdom)' },
  { code: 'en-US', endonym: 'English (United States)', english: 'English (United States)' },
  { code: 'et', endonym: 'Eesti', english: 'Estonian' },
  { code: 'fil', endonym: 'Filipino', english: 'Filipino' },
  { code: 'fi', endonym: 'Suomi', english: 'Finnish' },
  { code: 'fr', endonym: 'Français', english: 'French' },
  { code: 'de', endonym: 'Deutsch', english: 'German' },
  { code: 'el', endonym: 'Ελληνικά', english: 'Greek' },
  { code: 'gu', endonym: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'he', endonym: 'עברית', english: 'Hebrew' },
  { code: 'hi', endonym: 'हिन्दी', english: 'Hindi' },
  { code: 'hu', endonym: 'Magyar', english: 'Hungarian' },
  { code: 'is', endonym: 'Íslenska', english: 'Icelandic' },
  { code: 'id', endonym: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'ga', endonym: 'Gaeilge', english: 'Irish' },
  { code: 'it', endonym: 'Italiano', english: 'Italian' },
  { code: 'ja', endonym: '日本語', english: 'Japanese' },
  { code: 'km', endonym: 'ខ្មែរ', english: 'Khmer' },
  { code: 'ko', endonym: '한국어', english: 'Korean' },
  { code: 'lv', endonym: 'Latviešu', english: 'Latvian' },
  { code: 'lt', endonym: 'Lietuvių', english: 'Lithuanian' },
  { code: 'ms', endonym: 'Bahasa Melayu', english: 'Malay' },
  { code: 'mr', endonym: 'मराठी', english: 'Marathi' },
  { code: 'ne', endonym: 'नेपाली', english: 'Nepali' },
  { code: 'nb', endonym: 'Norsk bokmål', english: 'Norwegian Bokmål' },
  { code: 'fa', endonym: 'فارسی', english: 'Persian' },
  { code: 'pl', endonym: 'Polski', english: 'Polish' },
  { code: 'pt-BR', endonym: 'Português (Brasil)', english: 'Portuguese (Brazil)' },
  { code: 'pt-PT', endonym: 'Português (Portugal)', english: 'Portuguese (Portugal)' },
  { code: 'ro', endonym: 'Română', english: 'Romanian' },
  { code: 'ru', endonym: 'Русский', english: 'Russian' },
  { code: 'sr-Cyrl', endonym: 'Српски (ћирилица)', english: 'Serbian (Cyrillic)' },
  { code: 'sk', endonym: 'Slovenčina', english: 'Slovak' },
  { code: 'sl', endonym: 'Slovenščina', english: 'Slovenian' },
  { code: 'es', endonym: 'Español', english: 'Spanish' },
  { code: 'sw', endonym: 'Kiswahili', english: 'Swahili' },
  { code: 'sv', endonym: 'Svenska', english: 'Swedish' },
  { code: 'ta', endonym: 'தமிழ்', english: 'Tamil' },
  { code: 'te', endonym: 'తెలుగు', english: 'Telugu' },
  { code: 'th', endonym: 'ไทย', english: 'Thai' },
  { code: 'tr', endonym: 'Türkçe', english: 'Turkish' },
  { code: 'uk', endonym: 'Українська', english: 'Ukrainian' },
  { code: 'ur', endonym: 'اردو', english: 'Urdu' },
  { code: 'vi', endonym: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'cy', endonym: 'Cymraeg', english: 'Welsh' },
];

/** What a store falls back to when its target language is missing or unknown. */
export const DEFAULT_TARGET_LANGUAGE = 'zh-CN';

const BY_CODE = new Map(TARGET_LANGUAGES.map((l) => [l.code, l]));

/** True when `code` is one we offer. */
export function isTargetLanguage(code: unknown): code is string {
  return typeof code === 'string' && BY_CODE.has(code);
}

/** Older settings offered generic English; preserve their intent as US English. */
export function normalizeTargetLanguage(code: unknown): string {
  if (code === 'en') return 'en-US';
  return isTargetLanguage(code) ? code : DEFAULT_TARGET_LANGUAGE;
}

/**
 * The English name for `code`, for prompts. An unrecognised code passes through
 * unchanged: a model does better with a stray "pt-BR" than with nothing.
 */
export function languageName(code: string): string {
  return BY_CODE.get(code)?.english ?? code;
}

/**
 * The language's own name, for a control a reader reads rather than a model.
 * Unknown codes pass through for the same reason as above.
 */
export function languageEndonym(code: string): string {
  return BY_CODE.get(code)?.endonym ?? code;
}
