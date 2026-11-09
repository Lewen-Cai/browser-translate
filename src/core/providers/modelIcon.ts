import { MODEL_ICON_RULES, MONO_MODEL_ICONS } from './modelIcons.generated';
import type { ProviderId } from './registry';

/**
 * Which vendor icon a model id gets, by LobeHub's own table (see
 * modelIcons.generated.ts): the model id is lowercased and the first rule with
 * a matching pattern wins. Works on any id from any provider — a gateway's
 * `vendor/model`, a cloud vendor's bare name, a local runtime's `name:tag`.
 *
 * Purely cosmetic: nothing is routed by this, so a miss just means no mark.
 */
let compiled: (readonly [string, RegExp[]])[] | null = null;

export function modelIconName(model: string): string | null {
  const id = model.trim().toLowerCase();
  if (!id) return null;
  compiled ??= MODEL_ICON_RULES.map(([icon, patterns]) => [icon, patterns.map((p) => new RegExp(p, 'i'))] as const);
  for (const [icon, patterns] of compiled) {
    if (patterns.some((p) => p.test(id))) return icon;
  }
  return null;
}

/** Whether an icon is single-colour, to be painted in the text colour. */
export function isMonoModelIcon(icon: string): boolean {
  return MONO_MODEL_ICONS.has(icon);
}

/**
 * The icons that would only repeat a provider's own mark. A DeepSeek model under
 * the DeepSeek provider needs no second whale; the same model under OpenRouter
 * does, because there the provider's mark says nothing about it.
 */
const OWN_ICONS: Partial<Record<ProviderId, readonly string[]>> = {
  openai: ['openai'],
  anthropic: ['claude', 'anthropic'],
  gemini: ['gemini', 'google'],
  deepseek: ['deepseek'],
  moonshot: ['moonshot'],
  zhipu: ['zai', 'chatglm', 'glmv', 'cogview'],
  dashscope: ['qwen'],
  mistral: ['mistral'],
};

/** The vendor icon worth drawing beside a model of `provider`, if any. */
export function modelMarkFor(provider: ProviderId, model: string): string | undefined {
  const icon = modelIconName(model);
  if (!icon || OWN_ICONS[provider]?.includes(icon)) return undefined;
  return icon;
}
