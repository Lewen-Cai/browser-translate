import { describe, it, expect } from 'vitest';
import {
  LLM_IDS,
  PROVIDERS,
  PROVIDER_IDS,
  SERVICE_IDS,
  inferProvider,
  isProviderId,
  providersFor,
  knownDialect,
  supportsCapability,
} from './registry';
import { MT_ENGINE_IDS } from '~/core/mt/types';
import { isThinkingDialect } from './thinking';

describe('the registry', () => {
  it('gives every id a definition that agrees with its own key', () => {
    for (const id of PROVIDER_IDS) expect(PROVIDERS[id].id).toBe(id);
  });

  it('has no duplicate ids', () => {
    expect(new Set(PROVIDER_IDS).size).toBe(PROVIDER_IDS.length);
  });

  it('lists exactly the free engines as services', () => {
    expect([...SERVICE_IDS]).toEqual([...MT_ENGINE_IDS]);
  });

  it('carries the three vendors added in v0.2.0', () => {
    for (const id of ['anthropic', 'gemini', 'opencode'] as const) {
      expect(isProviderId(id)).toBe(true);
      expect(PROVIDERS[id].kind).toBe('llm');
    }
  });

});

describe('capabilities', () => {
  it('lets every provider translate', () => {
    for (const id of PROVIDER_IDS) expect(supportsCapability(id, 'translate')).toBe(true);
  });

  it('withholds dictionary from the services and grants it to every model', () => {
    for (const id of SERVICE_IDS) expect(supportsCapability(id, 'dictionary')).toBe(false);
    for (const id of LLM_IDS) expect(supportsCapability(id, 'dictionary')).toBe(true);
  });

  it('offers everything for translation but only models for a dictionary', () => {
    expect(providersFor('translate')).toHaveLength(PROVIDER_IDS.length);
    expect(providersFor('dictionary').map((p) => p.id)).toEqual([...LLM_IDS]);
  });
});

describe('browser reachability', () => {
  it('marks Anthropic as needing its direct-browser-access opt-in', () => {
    // Without this header the request is refused before JS can see it.
    expect(PROVIDERS.anthropic.requiredHeaders).toEqual({
      'anthropic-dangerous-direct-browser-access': 'true',
    });
  });

  it('marks opencode as needing a host permission', () => {
    // It sends no CORS headers at all, so no header can opt in.
    expect(PROVIDERS.opencode.hostPermission).toBe('https://opencode.ai/*');
  });

  it('leaves every other provider free of both', () => {
    for (const id of PROVIDER_IDS) {
      if (id === 'anthropic') continue;
      expect(PROVIDERS[id].requiredHeaders).toBeUndefined();
      if (id === 'opencode') continue;
      expect(PROVIDERS[id].hostPermission).toBeUndefined();
    }
  });
});

describe('keys and endpoints', () => {
  it('asks for no key from the services or a self-hosted runtime', () => {
    for (const id of [...SERVICE_IDS, 'local'] as const) expect(PROVIDERS[id].needsKey).toBe(false);
  });

  it('gives every cloud model at least one endpoint to start from', () => {
    for (const id of LLM_IDS) {
      if (id === 'local' || id === 'custom') {
        expect(PROVIDERS[id].endpoints).toHaveLength(0);
      } else {
        expect(PROVIDERS[id].endpoints.length).toBeGreaterThan(0);
      }
    }
  });

  it('offers both opencode products, which bill separately', () => {
    // Sending a Go subscriber to Zen reports an insufficient balance rather
    // than a wrong address, so both have to be reachable from the picker.
    expect(PROVIDERS.opencode.endpoints).toEqual([
      { label: 'Zen', baseUrl: 'https://opencode.ai/zen/v1' },
      { label: 'Go', baseUrl: 'https://opencode.ai/zen/go/v1' },
    ]);
  });

  it('covers every opencode endpoint with the one host grant', () => {
    const pattern = PROVIDERS.opencode.hostPermission!;
    const host = pattern.replace(/^https:\/\//, '').replace(/\/\*$/, '');
    for (const e of PROVIDERS.opencode.endpoints) {
      expect(new URL(e.baseUrl).host).toBe(host);
    }
  });

  it('matches a stored base URL back to its provider', () => {
    expect(inferProvider('https://api.anthropic.com/v1')).toBe('anthropic');
    expect(inferProvider('https://api.moonshot.ai/v1')).toBe('moonshot');
    expect(inferProvider('https://opencode.ai/zen/go/v1')).toBe('opencode');
    expect(inferProvider('http://localhost:1234/v1')).toBe('custom');
  });
});

describe('the thinking dialect each provider speaks', () => {
  it('leaves the dialect open where only the operator could know it', () => {
    // Not "these have no controls" — these are the rows whose controls are
    // decided by software we did not choose, so the choice is handed over.
    for (const id of ['openai', 'moonshot', 'mistral', 'local', 'custom'] as const) {
      expect(knownDialect(id)).toBeUndefined();
    }
  });

  it('keeps the vendor mappings the earlier releases shipped with', () => {
    expect(knownDialect('deepseek')).toBe('thinking-effort');
    expect(knownDialect('zhipu')).toBe('thinking-enabled-effort');
    expect(knownDialect('dashscope')).toBe('enable-thinking');
    expect(knownDialect('siliconflow')).toBe('enable-thinking');
    expect(knownDialect('openrouter')).toBe('reasoning-object');
    // Anthropic's compatibility layer ignores reasoning_effort, so effort has
    // to travel inside the native thinking object it passes through.
    expect(knownDialect('anthropic')).toBe('thinking-budget');
    // Gemini's scale stops at high; opencode's reaches xhigh.
    expect(knownDialect('gemini')).toBe('effort-capped');
    expect(knownDialect('opencode')).toBe('effort');
  });

  it('names a real dialect wherever it names one, and never for a free service', () => {
    for (const id of PROVIDER_IDS) {
      const dialect = knownDialect(id);
      if (dialect !== undefined) expect(isThinkingDialect(dialect)).toBe(true);
    }
    for (const id of SERVICE_IDS) expect(knownDialect(id)).toBeUndefined();
  });
});
