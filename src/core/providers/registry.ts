import type { ThinkingLevel, ThinkingSetting } from '~/storage/schema';

/**
 * Every provider that can produce a translation, in one list.
 *
 * The free services and the models sit in the same registry on purpose: routing
 * picks one provider per surface, and it should not have to care which kind it
 * is picking. What separates them is `capabilities` — a service can translate
 * and nothing else, so it simply never appears where a dictionary entry is
 * wanted. That is a property of the provider rather than a special case in the
 * code that needs one.
 */

/** Key-less public services. No configuration, no capability beyond translating. */
export const SERVICE_IDS = ['microsoft', 'google'] as const;

/** OpenAI-compatible endpoints the user supplies a key for. */
export const LLM_IDS = [
  'openai',
  'anthropic',
  'gemini',
  'deepseek',
  'moonshot',
  'zhipu',
  'dashscope',
  'siliconflow',
  'openrouter',
  'mistral',
  'opencode',
  'local',
  'custom',
] as const;

export const PROVIDER_IDS = [...SERVICE_IDS, ...LLM_IDS] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];
export type LlmId = (typeof LLM_IDS)[number];
export type ProviderId = (typeof PROVIDER_IDS)[number];

/**
 * What a provider can be asked for. `translate` is universal; `dictionary`
 * needs a model, because deciding that a selection is a single word worth
 * glossing — and then glossing it — is not something a translation service
 * exposes.
 */
export type Capability = 'translate' | 'dictionary';

export interface ProviderEndpoint {
  /** Display label, e.g. 'China' / 'International'. */
  label: string;
  baseUrl: string;
}

export interface ProviderDef {
  id: ProviderId;
  /** Brand name. Locale-invariant, so never an i18n string. */
  label: string;
  kind: 'service' | 'llm';
  capabilities: readonly Capability[];
  /** Selectable base URLs. Empty means the user types one. */
  endpoints: readonly ProviderEndpoint[];
  /** A self-hosted runtime needs no key; everything reachable over the internet does. */
  needsKey: boolean;
  /**
   * Headers the request must carry for a browser to be allowed to send it.
   * Anthropic refuses cross-origin requests outright unless this opt-in is
   * present — verified by fetching the endpoint from a page with and without
   * it: with it a bad key answers 401, without it the request never reaches JS.
   */
  requiredHeaders?: Readonly<Record<string, string>>;
  /**
   * Match pattern to request from `chrome.permissions` before first use.
   *
   * Set only for endpoints that send no CORS headers at all, where no header
   * opts in and a host permission is the only way through. Requesting it when
   * the provider is enabled — rather than listing it in the manifest — keeps
   * the prompt away from everyone who never touches this provider.
   */
  hostPermission?: string;
}

const LLM_CAPABILITIES = ['translate', 'dictionary'] as const;
const SERVICE_CAPABILITIES = ['translate'] as const;

function one(baseUrl: string): readonly ProviderEndpoint[] {
  return [{ label: 'Default', baseUrl }];
}

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  microsoft: {
    id: 'microsoft',
    label: 'Microsoft Translator',
    kind: 'service',
    capabilities: SERVICE_CAPABILITIES,
    endpoints: [],
    needsKey: false,
  },
  google: {
    id: 'google',
    label: 'Google Translate',
    kind: 'service',
    capabilities: SERVICE_CAPABILITIES,
    endpoints: [],
    needsKey: false,
  },

  openai: {
    id: 'openai',
    label: 'OpenAI',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: one('https://api.openai.com/v1'),
    needsKey: true,
  },
  anthropic: {
    id: 'anthropic',
    label: 'Claude',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    // Anthropic's OpenAI-compatibility layer, not the native /v1/messages API.
    endpoints: one('https://api.anthropic.com/v1'),
    needsKey: true,
    requiredHeaders: { 'anthropic-dangerous-direct-browser-access': 'true' },
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: one('https://generativelanguage.googleapis.com/v1beta/openai'),
    needsKey: true,
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: one('https://api.deepseek.com/v1'),
    needsKey: true,
  },
  moonshot: {
    id: 'moonshot',
    label: 'Moonshot (Kimi)',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: [
      { label: 'China', baseUrl: 'https://api.moonshot.cn/v1' },
      { label: 'International', baseUrl: 'https://api.moonshot.ai/v1' },
    ],
    needsKey: true,
  },
  zhipu: {
    id: 'zhipu',
    label: 'Zhipu GLM',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: [
      { label: 'China', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
      { label: 'International', baseUrl: 'https://api.z.ai/api/paas/v4' },
    ],
    needsKey: true,
  },
  dashscope: {
    id: 'dashscope',
    label: 'Qwen (DashScope)',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: [
      { label: 'China', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
      { label: 'International', baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1' },
    ],
    needsKey: true,
  },
  siliconflow: {
    id: 'siliconflow',
    label: 'SiliconFlow',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: [
      { label: 'China', baseUrl: 'https://api.siliconflow.cn/v1' },
      { label: 'International', baseUrl: 'https://api.siliconflow.com/v1' },
    ],
    needsKey: true,
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: one('https://openrouter.ai/api/v1'),
    needsKey: true,
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: one('https://api.mistral.ai/v1'),
    needsKey: true,
  },
  opencode: {
    id: 'opencode',
    label: 'opencode',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: one('https://opencode.ai/zen/v1'),
    needsKey: true,
    // The endpoint answers from a server (a bad key returns 401 AuthError) but
    // sends no CORS headers, so a browser request is refused before it can be
    // read. A host permission is the only way through.
    hostPermission: 'https://opencode.ai/*',
  },
  local: {
    id: 'local',
    label: 'Local model',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: [],
    needsKey: false,
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: [],
    needsKey: true,
  },
};

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}

export function supportsCapability(id: ProviderId, capability: Capability): boolean {
  return PROVIDERS[id].capabilities.includes(capability);
}

/** Every provider that can do `capability`, in registry order. */
export function providersFor(capability: Capability): ProviderDef[] {
  return PROVIDER_IDS.map((id) => PROVIDERS[id]).filter((p) => p.capabilities.includes(capability));
}

/** Match the stored base URL back to a provider, for repairing a store. */
export function inferProvider(baseUrl: string): ProviderId {
  for (const id of PROVIDER_IDS) {
    if (PROVIDERS[id].endpoints.some((e) => e.baseUrl === baseUrl)) return id;
  }
  return 'custom';
}

/** Token budgets for the tiered levels on budget-based providers. */
const THINKING_BUDGETS: Record<ThinkingLevel, number> = {
  low: 2048,
  medium: 4096,
  high: 8192,
  xhigh: 16384,
  max: 32768,
};

/** Providers whose effort scale tops out at 'high'. */
function cappedEffort(setting: ThinkingLevel): 'low' | 'medium' | 'high' {
  return setting === 'low' || setting === 'medium' ? setting : 'high';
}

/**
 * Top-level request-body fields that control thinking for `id` at the given
 * setting, or null when the provider has no safe parameter — nothing is sent
 * then, because an unknown field can 400 on a strict API.
 *
 * Verified against provider docs 2026-08:
 * - DeepSeek / Zhipu: thinking.type to disable; reasoning_effort for tiers.
 * - DashScope / SiliconFlow: enable_thinking boolean + thinking_budget tokens.
 * - OpenRouter: unified reasoning object; effort tops out at high.
 * - Anthropic: its compatibility layer *ignores* reasoning_effort, so effort
 *   has to go through the native thinking object it passes through instead.
 * - Gemini: top-level reasoning_effort, which uniquely accepts 'none' to turn
 *   reasoning off. Its own docs note 2.5 Pro and 3 cannot be turned off at all,
 *   in which case the value is simply not honoured — it is not an error.
 * - opencode is a gateway in front of many vendors' models and normalises none
 *   of this, so nothing is sent.
 */
export function thinkingPatch(
  id: ProviderId,
  setting: ThinkingSetting,
): Record<string, unknown> | null {
  switch (id) {
    case 'deepseek':
      return setting === 'off' ? { thinking: { type: 'disabled' } } : { reasoning_effort: setting };
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
        : { reasoning: { effort: cappedEffort(setting) } };
    case 'anthropic':
      return setting === 'off'
        ? { thinking: { type: 'disabled' } }
        : { thinking: { type: 'enabled', budget_tokens: THINKING_BUDGETS[setting] } };
    case 'gemini':
      return { reasoning_effort: setting === 'off' ? 'none' : cappedEffort(setting) };
    default:
      return null; // openai, moonshot, mistral, opencode, local, custom
  }
}

/** True when the provider has known thinking controls (drives the UI control). */
export function supportsThinkingToggle(id: ProviderId): boolean {
  return thinkingPatch(id, 'off') !== null;
}
