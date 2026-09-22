import { DEFAULT_STYLE_PROMPT, translationContext } from '~/core/prompt/style';

/** Internal ID-based batch protocol, not editable with the user's base prompt. */
export function batchSystemPrompt(
  targetLang: string,
  basePrompt = DEFAULT_STYLE_PROMPT,
  surface: 'fullPage' | 'subtitle' = 'fullPage',
): string {
  return (
    'BASE INSTRUCTIONS\n' + basePrompt + '\n\n' +
    translationContext(targetLang) + '\n\n' +
    'OUTPUT PROTOCOL — these format rules take precedence over conflicting base instructions.\n' +
    `You translate ${surface === 'subtitle' ? 'video subtitle' : 'web page'} text segments. ` +
    'Input is a JSON array of objects with id and text fields. Process the ENTIRE text of EACH item, never a word extracted from it.\n' +
    'Respond with ONLY a JSON array of objects with this shape: [{"id":0,"translation":"..."}]. ' +
    'Return each input id exactly once, unchanged, with a string translation. Do not merge or split items. ' +
    'Ids are alignment metadata, never part of the translated text. ' +
    'No code fences or commentary. Translation values are plain text: do not introduce markdown or HTML formatting. ' +
    'Preserve meaningful line breaks. If a segment needs no change, return its text as-is.'
  );
}

/** IDs let the parser verify correspondence and recover from reordered output. */
export function batchUserPrompt(segments: string[], targetLang: string): string {
  const input = segments.map((text, id) => ({ id, text }));
  return `Translate all ${segments.length} items to ${targetLang}. Return one result per id.\n\n${JSON.stringify(input)}`;
}
