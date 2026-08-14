import { describe, it, expect } from 'vitest';
import {
  LLM_IDS,
  PROVIDERS,
  PROVIDER_IDS,
  SERVICE_IDS,
  inferProvider,
  isProviderId,
  providersFor,
  supportsCapability,
  supportsThinkingToggle,
  thinkingPatch,
} from './registry';
import { MT_ENGINE_IDS } from '~/core/mt/types';
import { THINKING_SETTINGS } from '~/storage/schema';

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

  it('matches a stored base URL back to its provider', () => {
    expect(inferProvider('https://api.anthropic.com/v1')).toBe('anthropic');
    expect(inferProvider('https://api.moonshot.ai/v1')).toBe('moonshot');
    expect(inferProvider('http://localhost:1234/v1')).toBe('custom');
  });
});

describe('thinkingPatch', () => {
  it('never sends a patch for a provider without known controls', () => {
    for (const id of ['openai', 'moonshot', 'mistral', 'opencode', 'local', 'custom'] as const) {
      for (const setting of THINKING_SETTINGS) expect(thinkingPatch(id, setting)).toBeNull();
      expect(supportsThinkingToggle(id)).toBe(false);
    }
  });

  it('routes Anthropic through its thinking object, since it ignores reasoning_effort', () => {
    expect(thinkingPatch('anthropic', 'off')).toEqual({ thinking: { type: 'disabled' } });
    expect(thinkingPatch('anthropic', 'high')).toEqual({
      thinking: { type: 'enabled', budget_tokens: 8192 },
    });
    for (const setting of THINKING_SETTINGS) {
      expect(thinkingPatch('anthropic', setting)).not.toHaveProperty('reasoning_effort');
    }
  });

  it("uses Gemini's 'none' to turn reasoning off, and caps its effort at high", () => {
    expect(thinkingPatch('gemini', 'off')).toEqual({ reasoning_effort: 'none' });
    expect(thinkingPatch('gemini', 'medium')).toEqual({ reasoning_effort: 'medium' });
    expect(thinkingPatch('gemini', 'max')).toEqual({ reasoning_effort: 'high' });
  });

  it('keeps the mappings the earlier providers already shipped with', () => {
    expect(thinkingPatch('deepseek', 'off')).toEqual({ thinking: { type: 'disabled' } });
    expect(thinkingPatch('deepseek', 'xhigh')).toEqual({ reasoning_effort: 'xhigh' });
    expect(thinkingPatch('dashscope', 'off')).toEqual({ enable_thinking: false });
    expect(thinkingPatch('siliconflow', 'low')).toEqual({
      enable_thinking: true,
      thinking_budget: 2048,
    });
    expect(thinkingPatch('openrouter', 'off')).toEqual({ reasoning: { enabled: false } });
    expect(thinkingPatch('openrouter', 'max')).toEqual({ reasoning: { effort: 'high' } });
  });
});
