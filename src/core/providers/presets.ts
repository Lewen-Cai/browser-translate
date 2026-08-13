import type { ApiSettings, ProviderSlot, ThinkingLevel, ThinkingSetting } from '~/storage/schema';

export type CloudProvider = ApiSettings['cloudProvider'];

export interface CloudEndpoint {
  /** Display label for the endpoint, e.g. 'China' / 'International'. */
  label: string;
  /** Base URL written to storage when this endpoint is chosen. */
  baseUrl: string;
}

export interface CloudPreset {
  /** Label shown in the provider dropdown. */
  label: string;
  /** Selectable base URLs. Empty for 'custom' (free-text input). */
  endpoints: CloudEndpoint[];
}

export const CLOUD_PRESETS: Record<CloudProvider, CloudPreset> = {
  openai: { label: 'OpenAI', endpoints: [{ label: 'Default', baseUrl: 'https://api.openai.com/v1' }] },
  deepseek: { label: 'DeepSeek', endpoints: [{ label: 'Default', baseUrl: 'https://api.deepseek.com/v1' }] },
  moonshot: {
    label: 'Moonshot (Kimi)',
    endpoints: [
      { label: 'China', baseUrl: 'https://api.moonshot.cn/v1' },
      { label: 'International', baseUrl: 'https://api.moonshot.ai/v1' },
    ],
  },
  zhipu: {
    label: 'Zhipu GLM',
    endpoints: [
      { label: 'China', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
      { label: 'International', baseUrl: 'https://api.z.ai/api/paas/v4' },
    ],
  },
  dashscope: {
    label: 'Qwen (DashScope)',
    endpoints: [
      { label: 'China', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
      { label: 'International', baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1' },
    ],
  },
  siliconflow: {
    label: 'SiliconFlow',
    endpoints: [
      { label: 'China', baseUrl: 'https://api.siliconflow.cn/v1' },
      { label: 'International', baseUrl: 'https://api.siliconflow.com/v1' },
    ],
  },
  openrouter: { label: 'OpenRouter', endpoints: [{ label: 'Default', baseUrl: 'https://openrouter.ai/api/v1' }] },
  mistral: { label: 'Mistral', endpoints: [{ label: 'Default', baseUrl: 'https://api.mistral.ai/v1' }] },
  custom: { label: 'Custom', endpoints: [] },
};

/** Short brand list shown under the Base URL field, by service type. Cloud lists the
 *  supported cloud providers; local lists common self-hosted runtimes (Ollama belongs
 *  here, not in the cloud list). Brand names — locale-invariant, so not i18n strings. */
const CLOUD_PROVIDER_HINT = 'OpenAI · DeepSeek · Moonshot · Zhipu · Qwen · SiliconFlow · OpenRouter · Mistral';
const LOCAL_RUNTIME_HINT = 'LM Studio · Ollama · llama.cpp · vLLM';

export function baseUrlHint(providerType: 'cloud' | 'local'): string {
  return providerType === 'local' ? LOCAL_RUNTIME_HINT : CLOUD_PROVIDER_HINT;
}

/** Token budgets for the tiered levels on budget-based providers (Qwen/SiliconFlow). */
const THINKING_BUDGETS: Record<ThinkingLevel, number> = {
  low: 2048,
  medium: 4096,
  high: 8192,
  xhigh: 16384,
  max: 32768,
};

/**
 * Top-level request-body fields that control thinking/reasoning for `slot`
 * at the given setting ('off' or an effort tier), or null when the provider
 * has no safe param (nothing is sent: unknown fields can 400 on strict APIs,
 * e.g. OpenAI rejects reasoning_effort on non-reasoning models).
 *
 * Verified against provider docs 2026-08:
 * - DeepSeek: thinking.type to disable; reasoning_effort accepts all five
 *   tiers (maps medium→high, xhigh→max internally).
 * - Zhipu: thinking.type; reasoning_effort documented at the API level with
 *   the same five tiers (effort applies on GLM-5.2+, ignored before).
 * - DashScope/SiliconFlow: enable_thinking boolean + thinking_budget tokens.
 * - OpenRouter: unified reasoning object; effort supports low/medium/high.
 *
 * (A switch, not a Record lookup: ProviderSlot includes 'local', which is not
 * a CLOUD_PRESETS key, and noUncheckedIndexedAccess would flag the index.)
 */
export function thinkingPatch(slot: ProviderSlot, setting: ThinkingSetting): Record<string, unknown> | null {
  switch (slot) {
    case 'deepseek':
      return setting === 'off'
        ? { thinking: { type: 'disabled' } }
        : { reasoning_effort: setting };
    case 'zhipu':
      return setting === 'off'
        ? { thinking: { type: 'disabled' } }
        : { thinking: { type: 'enabled' }, reasoning_effort: setting };
    case 'dashscope':
    case 'siliconflow':
      return setting === 'off'
        ? { enable_thinking: false }
        : { enable_thinking: true, thinking_budget: THINKING_BUDGETS[setting] };
    case 'openrouter':
      return setting === 'off'
        ? { reasoning: { enabled: false } }
        : { reasoning: { effort: setting === 'low' || setting === 'medium' ? setting : 'high' } };
    default:
      return null; // openai, moonshot, mistral, custom, local
  }
}

/** True when the slot has known thinking-control params (drives the UI control). */
export function supportsThinkingToggle(slot: ProviderSlot): boolean {
  return thinkingPatch(slot, 'off') !== null;
}

/** True when `value` is a known cloud provider key (used by UI + migration validation). */
export function isCloudProvider(value: string): value is CloudProvider {
  return Object.prototype.hasOwnProperty.call(CLOUD_PRESETS, value);
}

/**
 * Return the CloudProvider whose any endpoint baseUrl matches `baseUrl`.
 * Falls back to 'custom' if nothing matches.
 */
export function inferCloudProvider(baseUrl: string): CloudProvider {
  for (const key of Object.keys(CLOUD_PRESETS) as CloudProvider[]) {
    if (key === 'custom') continue;
    if (CLOUD_PRESETS[key].endpoints.some((e) => e.baseUrl === baseUrl)) return key;
  }
  return 'custom';
}
