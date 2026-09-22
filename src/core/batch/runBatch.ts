export interface BatchDeps {
  cacheGet: (segment: string) => Promise<string | undefined>;
  cacheSet: (segment: string, translated: string) => Promise<void>;
  /** Return validated, aligned text or null for a protocol failure. */
  translateOnce: (segments: string[]) => Promise<string[] | null>;
  /** A separate text-only request, validated before returning. No raw fallback. */
  translateSingle: (segment: string) => Promise<string>;
}

async function translateWithFallback(segments: string[], deps: BatchDeps): Promise<string[]> {
  const parsed = await deps.translateOnce(segments);
  if (parsed && parsed.length === segments.length) return parsed;
  const out: string[] = [];
  for (const seg of segments) out.push(await deps.translateSingle(seg));
  return out;
}

/**
 * Translate `segments`, reusing cache per segment and translating only misses.
 * Returns an array aligned 1:1 with the input.
 */
export async function runBatch(segments: string[], deps: BatchDeps): Promise<string[]> {
  const out: string[] = new Array(segments.length);
  const missIdx: number[] = [];
  const missSegs: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    const cached = await deps.cacheGet(seg);
    if (cached !== undefined) out[i] = cached;
    else {
      missIdx.push(i);
      missSegs.push(seg);
    }
  }

  if (missSegs.length > 0) {
    const translated = await translateWithFallback(missSegs, deps);
    for (let k = 0; k < missIdx.length; k++) {
      const idx = missIdx[k]!;
      const val = translated[k]!;
      out[idx] = val;
      await deps.cacheSet(missSegs[k]!, val);
    }
  }
  return out;
}
