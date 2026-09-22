export type SelectionTask = 'auto' | 'translate';

/** Only short, self-contained terms may enter auto dictionary/translation mode.
 * This never suppresses a translation or decides what language the source is. */
export function selectionTask(text: string): SelectionTask {
  const source = text.trim();
  if ([...source].length > 120 || source.split(/\s+/u).length > 12) return 'translate';
  // Unspaced CJK prose must not count as one enormous dictionary word.
  if ((source.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0) > 32) return 'translate';
  if (/[\r\n{}[\]=<>;；]/u.test(source) || source.includes('```')) return 'translate';
  if (/[。！？]/u.test(source)) return 'translate';
  if (source.split(/\s+/u).length > 1 && /[.!?](?:\s|$)/u.test(source)) return 'translate';
  return 'auto';
}
