/**
 * The languages we translate INTO.
 *
 * Deliberately not the interface locales from `~/i18n`. The UI ships in eight
 * languages because each one is a hand-written string table someone had to
 * write; translating *into* a language costs nothing but a code the engine
 * already knows. Tying the two lists together capped the target list at eight
 * for no reason, so they are separate now.
 *
 * Every code below was checked against both free engines (2026-08) by asking
 * for a sentence whose translation differs visibly between neighbouring
 * languages, and confirming the answer came back in the language requested.
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
  { code: 'zh-CN', endonym: '简体中文', english: 'Chinese (Simplified)' },
  { code: 'zh-TW', endonym: '繁體中文', english: 'Chinese (Traditional)' },
  { code: 'cs', endonym: 'Čeština', english: 'Czech' },
  { code: 'da', endonym: 'Dansk', english: 'Danish' },
  { code: 'nl', endonym: 'Nederlands', english: 'Dutch' },
  { code: 'en', endonym: 'English', english: 'English' },
  { code: 'fi', endonym: 'Suomi', english: 'Finnish' },
  { code: 'fr', endonym: 'Français', english: 'French' },
  { code: 'de', endonym: 'Deutsch', english: 'German' },
  { code: 'el', endonym: 'Ελληνικά', english: 'Greek' },
  { code: 'he', endonym: 'עברית', english: 'Hebrew' },
  { code: 'hi', endonym: 'हिन्दी', english: 'Hindi' },
  { code: 'hu', endonym: 'Magyar', english: 'Hungarian' },
  { code: 'id', endonym: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'it', endonym: 'Italiano', english: 'Italian' },
  { code: 'ja', endonym: '日本語', english: 'Japanese' },
  { code: 'ko', endonym: '한국어', english: 'Korean' },
  { code: 'ms', endonym: 'Bahasa Melayu', english: 'Malay' },
  { code: 'nb', endonym: 'Norsk bokmål', english: 'Norwegian Bokmål' },
  { code: 'fa', endonym: 'فارسی', english: 'Persian' },
  { code: 'pl', endonym: 'Polski', english: 'Polish' },
  { code: 'pt-BR', endonym: 'Português (Brasil)', english: 'Portuguese (Brazil)' },
  { code: 'pt-PT', endonym: 'Português (Portugal)', english: 'Portuguese (Portugal)' },
  { code: 'ro', endonym: 'Română', english: 'Romanian' },
  { code: 'ru', endonym: 'Русский', english: 'Russian' },
  { code: 'es', endonym: 'Español', english: 'Spanish' },
  { code: 'sv', endonym: 'Svenska', english: 'Swedish' },
  { code: 'th', endonym: 'ไทย', english: 'Thai' },
  { code: 'tr', endonym: 'Türkçe', english: 'Turkish' },
  { code: 'uk', endonym: 'Українська', english: 'Ukrainian' },
  { code: 'ur', endonym: 'اردو', english: 'Urdu' },
  { code: 'vi', endonym: 'Tiếng Việt', english: 'Vietnamese' },
];

/** What a store falls back to when its target language is missing or unknown. */
export const DEFAULT_TARGET_LANGUAGE = 'zh-CN';

const BY_CODE = new Map(TARGET_LANGUAGES.map((l) => [l.code, l]));

/** True when `code` is one we offer. */
export function isTargetLanguage(code: unknown): code is string {
  return typeof code === 'string' && BY_CODE.has(code);
}

/**
 * The English name for `code`, for prompts. An unrecognised code passes through
 * unchanged: a model does better with a stray "pt-BR" than with nothing.
 */
export function languageName(code: string): string {
  return BY_CODE.get(code)?.english ?? code;
}

/**
 * `{ value, label }` pairs for a Select. The endonym leads, because a reader
 * looking for their own language scans for its own name; the English name
 * follows so the list stays searchable from a keyboard that cannot type the
 * endonym. Built once — the list never changes at runtime.
 */
export const TARGET_LANGUAGE_OPTIONS: readonly { value: string; label: string }[] =
  TARGET_LANGUAGES.map((l) => ({
    value: l.code,
    // A middle dot, not parentheses: several English names carry their own
    // parenthetical already ("Chinese (Simplified)"), and nesting them reads badly.
    label: l.endonym === l.english ? l.endonym : `${l.endonym} · ${l.english}`,
  }));
