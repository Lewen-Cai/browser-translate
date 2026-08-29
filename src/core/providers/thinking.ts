import type { ThinkingLevel, ThinkingSetting } from '~/storage/schema';

/**
 * How a request body says "think less".
 *
 * There is no standard for this. Every vendor bolted its own field onto the
 * chat-completions body, and an OpenAI-compatible endpoint inherits whichever
 * one the software in front of it implements — which is not necessarily the one
 * its upstream model uses. So the parameter is a property of the *wire format*,
 * not of the vendor: two providers can share a dialect, and a self-hosted
 * runtime can speak any of them depending on what is running.
 *
 * Naming them after the fields they send rather than after a vendor is
 * deliberate. Somebody pointing the extension at their own endpoint knows what
 * their server accepts; they do not necessarily know which vendor we happened
 * to copy it from.
 */
export const THINKING_DIALECTS = [
  'none',
  'effort',
  'effort-capped',
  'thinking-effort',
  'thinking-enabled-effort',
  'thinking-budget',
  'enable-thinking',
  'reasoning-object',
] as const;

export type ThinkingDialect = (typeof THINKING_DIALECTS)[number];

export function isThinkingDialect(value: unknown): value is ThinkingDialect {
  return typeof value === 'string' && (THINKING_DIALECTS as readonly string[]).includes(value);
}

/**
 * What each dialect puts on the wire. Locale-invariant: this is the vocabulary
 * of the API being configured, and translating `reasoning_effort` would make it
 * unmatchable against the docs the reader has open.
 */
export const DIALECT_WIRE_LABEL: Record<ThinkingDialect, string> = {
  'none': '—',
  'effort': 'reasoning_effort',
  'effort-capped': 'reasoning_effort (low/medium/high)',
  'thinking-effort': 'thinking.type + reasoning_effort',
  'thinking-enabled-effort': 'thinking.type ↔ reasoning_effort',
  'thinking-budget': 'thinking.budget_tokens',
  'enable-thinking': 'enable_thinking + thinking_budget',
  'reasoning-object': 'reasoning{}',
};

/** Token budgets for the tiered levels on budget-based dialects. */
const THINKING_BUDGETS: Record<ThinkingLevel, number> = {
  low: 2048,
  medium: 4096,
  high: 8192,
  xhigh: 16384,
  max: 32768,
};

/** Dialects whose effort scale tops out at 'high'. */
function cappedEffort(setting: ThinkingLevel): 'low' | 'medium' | 'high' {
  return setting === 'low' || setting === 'medium' ? setting : 'high';
}

/**
 * Top-level request-body fields for one dialect at one setting, or null when
 * the dialect is 'none' — nothing is sent then, because an unknown field can
 * 400 on a strict API.
 *
 * Verified against provider docs 2026-08:
 * - `thinking-effort` (DeepSeek): thinking.type disables; reasoning_effort tiers.
 * - `thinking-enabled-effort` (Zhipu): the same two fields, but the tier only
 *   takes effect alongside an explicit `thinking.type: 'enabled'`.
 * - `enable-thinking` (DashScope, SiliconFlow): boolean plus a token budget.
 * - `reasoning-object` (OpenRouter): one unified object; effort tops out at high.
 * - `thinking-budget` (Anthropic): its compatibility layer *ignores*
 *   reasoning_effort, so effort has to go through the native thinking object it
 *   passes through instead.
 * - `effort-capped` (Gemini): top-level reasoning_effort, which uniquely accepts
 *   'none' to turn reasoning off. Its own docs note 2.5 Pro and 3 cannot be
 *   turned off at all, in which case the value is simply not honoured — it is
 *   not an error.
 * - `effort` (opencode): the same field over a longer scale —
 *   none/minimal/low/medium/high/xhigh/max — of which the chat-completions
 *   variant rejects 'max', so ours caps there.
 */
export function dialectPatch(
  dialect: ThinkingDialect,
  setting: ThinkingSetting,
): Record<string, unknown> | null {
  switch (dialect) {
    case 'thinking-effort':
      return setting === 'off' ? { thinking: { type: 'disabled' } } : { reasoning_effort: setting };
    case 'thinking-enabled-effort':
      return setting === 'off'
        ? { thinking: { type: 'disabled' } }
        : { thinking: { type: 'enabled' }, reasoning_effort: setting };
    case 'enable-thinking':
      return setting === 'off'
        ? { enable_thinking: false }
        : { enable_thinking: true, thinking_budget: THINKING_BUDGETS[setting] };
    case 'reasoning-object':
      return setting === 'off'
        ? { reasoning: { enabled: false } }
        : { reasoning: { effort: cappedEffort(setting) } };
    case 'thinking-budget':
      return setting === 'off'
        ? { thinking: { type: 'disabled' } }
        : { thinking: { type: 'enabled', budget_tokens: THINKING_BUDGETS[setting] } };
    case 'effort-capped':
      return { reasoning_effort: setting === 'off' ? 'none' : cappedEffort(setting) };
    case 'effort':
      return { reasoning_effort: setting === 'off' ? 'none' : setting === 'max' ? 'xhigh' : setting };
    case 'none':
      return null;
  }
}
