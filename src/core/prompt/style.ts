/**
 * The single, fixed translation-style prompt. The model routes topic/register on
 * its own; per-topic prompt templates were removed in v0.1.8 (see PROJECT_LOG).
 */
export const DEFAULT_STYLE_PROMPT =
  'You are a professional translator. Translate the given text accurately and naturally. ' +
  'Preserve the original meaning, tone, and formatting. ' +
  'Output ONLY the translation — no explanations, no quotes, no labels.';

/** The complete user message for the selection-translate path. */
export function selectionUserPrompt(text: string, targetLang: string): string {
  return `Translate the following text to ${targetLang}:\n\n${text}`;
}
