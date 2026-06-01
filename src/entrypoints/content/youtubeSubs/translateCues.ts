import type { Cue } from '~/core/subtitles/types';

// When the on-screen line is still untranslated, use a SMALL batch so it appears
// fast. Once caught up (buffering ahead of the playhead), use LARGE batches — far
// fewer requests means the per-batch system-prompt overhead is amortized and total
// throughput is much higher.
const FAST_SEGMENTS = 4;
const FAST_CHARS = 400;
const BULK_SEGMENTS = 15;
const BULK_CHARS = 1200;

export interface CueTranslatorDeps {
  translateBatchFn: (req: {
    type: 'translate:batch';
    requestId: string;
    segments: string[];
    targetLang: string;
  }) => Promise<string[]>;
  abortFn: (requestId: string) => void;
  getTargetLang: () => string;
  getCurrentTimeMs: () => number;
  onUpdate: () => void;
  /** Number of concurrent in-flight batches; the caller picks the value per provider
   *  (cloud fans out across its fleet; local stays small as a shallow pipeline). */
  concurrency: number;
}

export interface CueTranslator {
  run: (cues: Cue[]) => Promise<void>;
  get: (cueId: number) => string | undefined;
  teardown: () => void;
}

export function createCueTranslator(deps: CueTranslatorDeps): CueTranslator {
  const map = new Map<number, string>();
  let epoch = 0;
  let seq = 0;
  const inFlightIds = new Set<string>();

  /**
   * Adaptive, single-stream translation. Before EACH batch we re-read the playhead
   * and pick the untranslated cues nearest to (and ahead of) it. This keeps the
   * line the user is currently watching translated first, and — crucially — makes
   * seeking responsive: after a scrub, the next batch targets the new position
   * instead of grinding through a fixed queue computed at start time.
   */
  async function run(cues: Cue[]): Promise<void> {
    const myEpoch = epoch;
    const remaining = new Map<number, Cue>(cues.map((c) => [c.id, c]));

    // Claim the next batch nearest the (live) playhead and remove it from the queue
    // so concurrent workers never pick the same cues. Small batch while the on-screen
    // line is still pending (fast first paint), large batch when buffering ahead.
    function claimBatch(): Cue[] | null {
      if (remaining.size === 0) return null;
      const now = deps.getCurrentTimeMs();
      const ordered = [...remaining.values()].sort((a, b) => {
        const aAhead = a.endMs >= now;
        const bAhead = b.endMs >= now;
        if (aAhead !== bAhead) return aAhead ? -1 : 1; // upcoming cues first
        return aAhead ? a.startMs - b.startMs : b.startMs - a.startMs; // soonest / most-recent first
      });
      const currentPending = ordered.some((c) => c.startMs <= now && now < c.endMs);
      const maxSeg = currentPending ? FAST_SEGMENTS : BULK_SEGMENTS;
      const maxChars = currentPending ? FAST_CHARS : BULK_CHARS;
      const batch: Cue[] = [];
      let chars = 0;
      for (const c of ordered) {
        if (batch.length >= maxSeg) break;
        if (batch.length > 0 && chars + c.text.length > maxChars) break;
        batch.push(c);
        chars += c.text.length;
      }
      batch.forEach((c) => remaining.delete(c.id)); // claim
      return batch;
    }

    async function worker(): Promise<void> {
      for (let batch = claimBatch(); batch && myEpoch === epoch; batch = claimBatch()) {
        const requestId = `ytsub-${myEpoch}-${++seq}`;
        inFlightIds.add(requestId);
        try {
          const translations = await deps.translateBatchFn({
            type: 'translate:batch',
            requestId,
            segments: batch.map((c) => c.text),
            targetLang: deps.getTargetLang(),
          });
          if (myEpoch !== epoch) return; // torn down — drop stale result
          batch.forEach((c, j) => {
            const t = translations[j];
            if (t) map.set(c.id, t);
          });
          deps.onUpdate();
        } catch {
          if (myEpoch !== epoch) return;
          // batch failed — those cues were already claimed (no retry), so the pool
          // can't spin forever.
        } finally {
          inFlightIds.delete(requestId);
        }
      }
    }

    const workers = Math.max(1, deps.concurrency);
    await Promise.all(Array.from({ length: workers }, () => worker()));
  }

  function teardown(): void {
    epoch++;
    for (const id of inFlightIds) deps.abortFn(id);
    inFlightIds.clear();
    map.clear();
  }

  return { run, get: (id) => map.get(id), teardown };
}
