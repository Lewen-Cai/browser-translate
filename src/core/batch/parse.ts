/** Decode the internal ID-based batch protocol. Metadata must be complete and
 * unique; numbers/objects are not coerced into successful string translations.
 * Fences/preamble are tolerated, but never returned to the UI. */
export function parseBatchArray(raw: string, expectedCount: number): string[] | null {
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start < 0 || end <= start) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw.slice(start, end + 1)); }
  catch { return null; }
  if (!Array.isArray(parsed) || parsed.length !== expectedCount) return null;
  const seen = new Set<number>();
  const out: string[] = new Array(expectedCount);
  for (const item of parsed) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const { id, translation } = item as Record<string, unknown>;
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 0 || id >= expectedCount || seen.has(id)) return null;
    if (typeof translation !== 'string') return null;
    seen.add(id);
    out[id] = translation;
  }
  return seen.size === expectedCount ? out : null;
}
