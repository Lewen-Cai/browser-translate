/**
 * Machine-translation engines: the free, key-less services (Microsoft, Google).
 *
 * They differ from `~/core/providers` (LLM, bring-your-own-key) in three ways
 * that shape this interface: plain text in / plain text out (no prompts), a
 * whole batch per call (no streaming), and no credentials. Errors are reported
 * with the provider error shape so the background handles both alike.
 */

export const MT_ENGINE_IDS = ['microsoft', 'google'] as const;
export type MtEngineId = (typeof MT_ENGINE_IDS)[number];

export function isMtEngineId(value: unknown): value is MtEngineId {
  return typeof value === 'string' && (MT_ENGINE_IDS as readonly string[]).includes(value);
}

export interface MtRequest {
  /** Texts to translate. The result has the same length and order. */
  texts: string[];
  /** App language code (e.g. 'zh-CN'); mapped to the engine's own code. */
  targetLang: string;
  /** App language code, or undefined to let the engine auto-detect. */
  sourceLang?: string;
  signal?: AbortSignal;
}

export type MtTranslateFn = (req: MtRequest) => Promise<string[]>;

export interface MtEngine {
  readonly id: MtEngineId;
  /** Brand label — locale-invariant, so not an i18n string. */
  readonly label: string;
  /** Upper bounds per request, chosen to stay well inside each service's limits. */
  readonly maxBatchSize: number;
  readonly maxBatchChars: number;
  translate: MtTranslateFn;
}
