import { chunkTexts } from './chunk';
import type { MtEngine, MtRequest } from './types';

/**
 * Translate an arbitrarily long list through an engine, splitting it into
 * request-sized batches and running a few in parallel. The returned array lines
 * up with the input: batches are written back by index, not by completion order.
 */
export async function mtTranslateAll(
  engine: MtEngine,
  req: MtRequest,
  concurrency = 4,
): Promise<string[]> {
  const batches = chunkTexts(req.texts, engine.maxBatchSize, engine.maxBatchChars);
  if (batches.length === 0) return [];

  const results: string[][] = new Array<string[]>(batches.length);
  let next = 0;

  async function worker(): Promise<void> {
    for (let i = next++; i < batches.length; i = next++) {
      results[i] = await engine.translate({ ...req, texts: batches[i]! });
    }
  }

  const workers = Math.max(1, Math.min(concurrency, batches.length));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results.flat();
}
