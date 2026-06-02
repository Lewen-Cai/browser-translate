import type { ApiSettings } from '~/storage/schema';

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
