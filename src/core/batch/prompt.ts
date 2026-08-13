import { DEFAULT_STYLE_PROMPT } from '~/core/prompt/style';

/**
 * System prompt for full-page batch translation. Embeds the fixed default
 * translation style for tone, but always produces a JSON array of plain-text
 * translations — never a dictionary object.
 */
export function batchSystemPrompt(): string {
  return (
    'You are a translation engine for a web page. You receive a numbered list of ' +
    'text segments and translate EACH into the target language.\n' +
    'Respond with ONLY a JSON array of strings — one translation per input ' +
    'segment, in the same order, the same length as the input. No markdown, no ' +
    'code fences, no commentary, no keys. Example: ["译文1","译文2"].\n' +
    'Each element is plain translated text only. Do NOT repeat the input segment ' +
    'numbers in your output. If a segment needs no change, ' +
    'return it as-is. Preserve inline meaning and tone.\n' +
    'Follow these translation style instructions:\n' +
    DEFAULT_STYLE_PROMPT
  );
}

/** Build the user message: a numbered segment list + the target language. */
export function batchUserPrompt(segments: string[], targetLang: string): string {
  const numbered = segments.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return (
    `Translate these ${segments.length} segments to ${targetLang}. ` +
    `Return a JSON array of exactly ${segments.length} strings.\n\n${numbered}`
  );
}
