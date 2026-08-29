import { THINKING_SETTINGS, type ThinkingSetting } from '~/storage/schema';
import { DIALECT_WIRE_LABEL, THINKING_DIALECTS } from '~/core/providers/thinking';

/** Tier names are locale-invariant tech vocabulary; only 'off' is localized. */
const TIER_LABELS: Record<Exclude<ThinkingSetting, 'off'>, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'XHigh',
  max: 'Max',
};

export function thinkingOptions(offLabel: string): Array<{ value: string; label: string }> {
  return THINKING_SETTINGS.map((s) => ({
    value: s,
    label: s === 'off' ? offLabel : TIER_LABELS[s],
  }));
}

/**
 * The reasoning-parameter picker, for a row whose dialect is the user's to say.
 *
 * Every option but 'none' is labelled with the fields it puts on the wire, and
 * those are not translated: they are the vocabulary of the API being configured,
 * and a translated `reasoning_effort` could not be matched against the docs the
 * reader has open beside this.
 */
export function dialectOptions(noneLabel: string): Array<{ value: string; label: string }> {
  return THINKING_DIALECTS.map((d) => ({
    value: d,
    label: d === 'none' ? noneLabel : DIALECT_WIRE_LABEL[d],
  }));
}
