/**
 * Split texts into request-sized batches. A single text longer than `maxChars`
 * still gets its own batch rather than being dropped or cut — the services
 * accept long strings, the cap only exists to keep bodies reasonable.
 */
export function chunkTexts(texts: string[], maxCount: number, maxChars: number): string[][] {
  const count = Math.max(1, maxCount);
  const chars = Math.max(1, maxChars);
  const batches: string[][] = [];
  let batch: string[] = [];
  let size = 0;

  for (const text of texts) {
    if (batch.length > 0 && (batch.length >= count || size + text.length > chars)) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(text);
    size += text.length;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}
