/**
 * The dictionary half of the unified auto prompt. Carries the exact JSON contract
 * that `parseDictionaryEntry` expects. Kept as a standalone constant so the
 * builder and tests can reference it.
 */
export const DICTIONARY_SPEC =
  'When the selection is a single word, a short term, an idiom, or a proper noun worth a ' +
  'dictionary entry, respond with ONLY a single JSON object — no markdown, no code fences, ' +
  'no prose — with this exact shape:\n' +
  '{"headword": string, "translation": string, "phonetic": {"us": string, "uk": string} | null, "partOfSpeech": string, "senses": string[], "example": {"source": string, "target": string} | null}\n' +
  'Field rules:\n' +
  '- headword: the term itself, in its original language.\n' +
  '- translation: the term\'s established or natural translation in the target language (the formal equivalent of the headword), distinct from the explanatory senses. Empty string if the target language is the same as the headword\'s language, or if no sensible translation exists.\n' +
  '- phonetic: provide US and UK IPA in slashes ONLY when the headword is a SINGLE English/Latin word ' +
  '(e.g. {"us": "/ˈkʌlər/", "uk": "/ˈkʌlə/"}). Set phonetic to null for multi-word phrases, proper nouns, ' +
  'and any non-Latin script (Chinese/Japanese/Korean) — never add pinyin or romanization.\n' +
  '- partOfSpeech: for a SINGLE word, its part of speech in the target language. For a multi-word phrase, term, or proper noun, use the target-language word for "phrase" (e.g. 短语) or an empty string — never label a multi-word selection with a single-word part of speech like "noun".\n' +
  '- senses: 1 to 3 short definitions in the target language; for a proper noun, a single sense glossing what it refers to.\n' +
  '- example: one natural example sentence (source in the term\'s own language, target translated into the target language), or null.';

import { DEFAULT_STYLE_PROMPT } from '~/core/prompt/style';

/**
 * Build the unified system prompt. The model decides between returning a
 * dictionary JSON object (per DICTIONARY_SPEC) and a plain-text translation that
 * follows the fixed default translation style.
 */
export function autoSystemPrompt(): string {
  return (
    'You handle a user text selection and decide, on your own, which of two modes fits.\n\n' +
    'Routing rule: choose DICTIONARY MODE when the selection is a single word, or a short established ' +
    'term, idiom, or proper noun worth a glossary entry. Choose TRANSLATION MODE when the selection is a ' +
    'sentence, a clause, or running prose — even if short. A single word should almost always use ' +
    'DICTIONARY MODE.\n\n' +
    'DICTIONARY MODE — ' + DICTIONARY_SPEC + '\n\n' +
    'TRANSLATION MODE — output ONLY the translation as plain text: no JSON, no quotes, no labels. ' +
    'Follow these translation style instructions:\n' +
    DEFAULT_STYLE_PROMPT + '\n\n' +
    'Output ONLY the dictionary JSON object OR the plain translation — nothing else.'
  );
}
