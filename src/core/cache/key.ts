export interface CacheKeyInput {
  text: string;
  /**
   * Which provider produced the translation, by registry id. Free services
   * have no model name, so without this every service's results would collide
   * under the same empty-model key — and two vendors serving the same model
   * name would collide with each other.
   */
  engine: string;
  model: string;
  /**
   * Namespace discriminator: selection results may be dictionary JSON while
   * fullpage results are plain text — the two must never share cache entries.
   */
  mode: 'selection' | 'fullpage';
  targetLang: string;
}

/**
 * Computes a SHA-256-based cache key. Uses Web Crypto (available in
 * service worker, content script, and jsdom test env).
 * Fields are joined with a null byte separator to prevent collisions
 * where one field's value ends with the same characters as another
 * field's separator boundary.
 */
export async function computeCacheKey(input: CacheKeyInput): Promise<string> {
  const canonical = [
    input.text,
    input.engine,
    input.model,
    input.mode,
    input.targetLang,
  ].join('\0'); // null byte separator — cannot appear in normal text
  const bytes = new TextEncoder().encode(canonical);
  const hashBuf = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hashBuf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
