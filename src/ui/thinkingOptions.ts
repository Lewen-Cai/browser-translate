import { THINKING_SETTINGS, type ThinkingSetting } from '~/storage/schema';

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
