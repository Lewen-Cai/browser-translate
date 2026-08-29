import type { ThinkingDialect } from './thinking';

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
  /**
   * Whether an address outside `endpoints` may be typed in.
   *
   * For a vendor whose public endpoints are the whole story, the list is the
   * whole story and the field is closed. Set this where the vendor also hands
   * out addresses we cannot enumerate — a per-workspace or per-deployment host
   * — so the list stays a shortcut rather than a ceiling.
   */
  allowCustomEndpoint?: boolean;
  /**
   * Which request-body fields turn this provider's reasoning up or off.
   * Absent means we know of none, and nothing is sent.
   */
  thinkingDialect?: ThinkingDialect;
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
    thinkingDialect: 'thinking-budget',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: one('https://generativelanguage.googleapis.com/v1beta/openai'),
    needsKey: true,
    thinkingDialect: 'effort-capped',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: one('https://api.deepseek.com/v1'),
    needsKey: true,
    thinkingDialect: 'thinking-effort',
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
    thinkingDialect: 'thinking-enabled-effort',
  },
  dashscope: {
    id: 'dashscope',
    label: 'Qwen (DashScope)',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    // Two axes, and both of them decide whether a key works at all. Taken from
    // Model Studio's own "Base URL 总览", both the China and the international
    // edition of it, because the two pages do not list the same endpoints.
    //
    // Region first: four regions publish a shared domain, and each has its own
    // key and its own model list — the docs say plainly that none of the three
    // carries across. Frankfurt and Tokyo publish none: they are reachable only
    // at {WorkspaceId}.{region}.maas.aliyuncs.com, which is why this provider
    // accepts a typed address as well. We cannot enumerate somebody's
    // workspace, and pretending the list is complete would strand them.
    //
    // Then the plan, which is a different product rather than a discount. Token
    // Plan uses keys prefixed sk-sp- that the metered endpoints refuse and
    // which refuse metered keys in turn, and serves a catalogue of its own.
    //
    // Its predecessor, Coding Plan, is not listed. It is still served but no
    // longer sold — Lite closed to new customers in March 2026, Pro is not
    // restocked — so listing it would offer most people a plan they cannot buy,
    // and anyone who does hold one has the address field to type it into.
    //
    // Note for anyone reading this before pointing an extension at them: the
    // plan endpoints are documented as being for interactive AI tools, not as
    // a general API to build a service on.
    endpoints: [
      { label: 'Beijing', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
      { label: 'Singapore', baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1' },
      {
        label: 'Hong Kong',
        baseUrl: 'https://cn-hongkong.dashscope.aliyuncs.com/compatible-mode/v1',
      },
      { label: 'US (Virginia)', baseUrl: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1' },
      {
        label: 'Token Plan · Beijing',
        baseUrl: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
      },
      {
        label: 'Token Plan · Singapore',
        baseUrl: 'https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1',
      },
    ],
    needsKey: true,
    allowCustomEndpoint: true,
    thinkingDialect: 'enable-thinking',
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
    thinkingDialect: 'enable-thinking',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    kind: 'llm',
    capabilities: LLM_CAPABILITIES,
    endpoints: one('https://openrouter.ai/api/v1'),
    needsKey: true,
    thinkingDialect: 'reasoning-object',
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
    // Two products behind one account, and picking the wrong one fails in a way
    // that reads like a billing problem rather than a wrong address: Zen bills
    // per request against a credit balance, Go is a flat subscription, and the
    // pools are separate. A Go subscriber pointed at Zen is told their balance
    // is insufficient while their plan sits unused. They also serve different
    // model catalogues — Zen has the Claude and GPT families, Go has MiniMax,
    // Kimi, GLM and Qwen — so the endpoint decides what `model` may name.
    endpoints: [
      { label: 'Zen', baseUrl: 'https://opencode.ai/zen/v1' },
      { label: 'Go', baseUrl: 'https://opencode.ai/zen/go/v1' },
    ],
    needsKey: true,
    // The endpoint answers from a server (a bad key returns 401 AuthError) but
    // sends no CORS headers, so a browser request is refused before it can be
    // read. A host permission is the only way through.
    hostPermission: 'https://opencode.ai/*',
    thinkingDialect: 'effort',
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

/**
 * The dialect we know this provider speaks, or undefined where we do not.
 *
 * Undefined is not "no controls" — it is "not ours to say". A custom endpoint
 * or a local runtime answers in whatever dialect the software behind it
 * implements, which only its operator knows, so those are the rows that get to
 * name one themselves. See `effectiveDialect` in ./resolve.
 */
export function knownDialect(id: ProviderId): ThinkingDialect | undefined {
  return PROVIDERS[id].thinkingDialect;
}
