import { describe, it, expect } from 'vitest';
import {
  CLOUD_PRESETS,
  inferCloudProvider,
  isCloudProvider,
  baseUrlHint,
  thinkingPatch,
  supportsThinkingToggle,
  type CloudProvider,
} from './presets';
import type { ProviderSlot } from '~/storage/schema';

describe('CLOUD_PRESETS', () => {
  it('custom has no endpoints; every other provider has at least one', () => {
    expect(CLOUD_PRESETS.custom.endpoints).toEqual([]);
    for (const key of Object.keys(CLOUD_PRESETS) as CloudProvider[]) {
      if (key === 'custom') continue;
      expect(CLOUD_PRESETS[key].endpoints.length).toBeGreaterThan(0);
    }
  });

  it('every endpoint baseUrl is a non-empty https URL and globally unique', () => {
    const seen = new Set<string>();
    for (const key of Object.keys(CLOUD_PRESETS) as CloudProvider[]) {
      for (const ep of CLOUD_PRESETS[key].endpoints) {
        expect(ep.baseUrl).toMatch(/^https:\/\/.+/);
        expect(ep.label.length).toBeGreaterThan(0);
        expect(seen.has(ep.baseUrl)).toBe(false);
        seen.add(ep.baseUrl);
      }
    }
  });

  it('includes the six new providers', () => {
    for (const key of ['moonshot', 'zhipu', 'dashscope', 'siliconflow', 'openrouter', 'mistral'] as CloudProvider[]) {
      expect(CLOUD_PRESETS[key]).toBeDefined();
    }
  });
});

describe('inferCloudProvider', () => {
  it('maps each endpoint URL (incl. International) back to its provider', () => {
    expect(inferCloudProvider('https://api.moonshot.cn/v1')).toBe('moonshot');
    expect(inferCloudProvider('https://api.moonshot.ai/v1')).toBe('moonshot');
    expect(inferCloudProvider('https://dashscope-intl.aliyuncs.com/compatible-mode/v1')).toBe('dashscope');
    expect(inferCloudProvider('https://api.siliconflow.com/v1')).toBe('siliconflow');
    expect(inferCloudProvider('https://api.openai.com/v1')).toBe('openai');
  });
  it('falls back to custom for an unknown URL', () => {
    expect(inferCloudProvider('https://example.invalid/v1')).toBe('custom');
  });
});

describe('baseUrlHint', () => {
  it('lists cloud providers for the cloud type', () => {
    const hint = baseUrlHint('cloud');
    expect(hint).toContain('OpenAI');
    expect(hint).toContain('DeepSeek');
    // Ollama is a local runtime — it must NOT appear in the cloud hint.
    expect(hint).not.toContain('Ollama');
  });
  it('lists local runtimes for the local type', () => {
    const hint = baseUrlHint('local');
    expect(hint).toContain('LM Studio');
    expect(hint).toContain('Ollama');
    // Cloud-only brands must NOT appear in the local hint.
    expect(hint).not.toContain('DeepSeek');
    expect(hint).not.toContain('OpenAI');
  });
});

describe('thinkingPatch', () => {
  it('returns the exact provider-specific disable patch for supported slots', () => {
    expect(thinkingPatch('deepseek', 'off')).toEqual({ thinking: { type: 'disabled' } });
    expect(thinkingPatch('zhipu', 'off')).toEqual({ thinking: { type: 'disabled' } });
    expect(thinkingPatch('dashscope', 'off')).toEqual({ enable_thinking: false });
    expect(thinkingPatch('siliconflow', 'off')).toEqual({ enable_thinking: false });
    expect(thinkingPatch('openrouter', 'off')).toEqual({ reasoning: { enabled: false } });
  });

  it('maps effort tiers to reasoning_effort for deepseek (all five sent verbatim)', () => {
    expect(thinkingPatch('deepseek', 'low')).toEqual({ reasoning_effort: 'low' });
    expect(thinkingPatch('deepseek', 'medium')).toEqual({ reasoning_effort: 'medium' });
    expect(thinkingPatch('deepseek', 'max')).toEqual({ reasoning_effort: 'max' });
  });

  it('enables thinking plus reasoning_effort for zhipu tiers', () => {
    expect(thinkingPatch('zhipu', 'xhigh')).toEqual({
      thinking: { type: 'enabled' },
      reasoning_effort: 'xhigh',
    });
  });

  it('maps tiers to enable_thinking + a growing thinking_budget for qwen/siliconflow', () => {
    const low = thinkingPatch('dashscope', 'low') as { thinking_budget: number };
    const max = thinkingPatch('siliconflow', 'max') as { thinking_budget: number };
    expect(thinkingPatch('dashscope', 'medium')).toEqual({ enable_thinking: true, thinking_budget: 4096 });
    expect(low.thinking_budget).toBeLessThan(max.thinking_budget);
  });

  it('clamps openrouter effort to its low/medium/high vocabulary', () => {
    expect(thinkingPatch('openrouter', 'low')).toEqual({ reasoning: { effort: 'low' } });
    expect(thinkingPatch('openrouter', 'medium')).toEqual({ reasoning: { effort: 'medium' } });
    expect(thinkingPatch('openrouter', 'high')).toEqual({ reasoning: { effort: 'high' } });
    expect(thinkingPatch('openrouter', 'xhigh')).toEqual({ reasoning: { effort: 'high' } });
    expect(thinkingPatch('openrouter', 'max')).toEqual({ reasoning: { effort: 'high' } });
  });

  it('returns null at every setting for slots without safe params', () => {
    for (const slot of ['openai', 'moonshot', 'mistral', 'custom', 'local'] as ProviderSlot[]) {
      expect(thinkingPatch(slot, 'off')).toBeNull();
      expect(thinkingPatch(slot, 'max')).toBeNull();
    }
  });
});

describe('supportsThinkingToggle', () => {
  it('mirrors thinkingDisablePatch availability', () => {
    expect(supportsThinkingToggle('deepseek')).toBe(true);
    expect(supportsThinkingToggle('openrouter')).toBe(true);
    expect(supportsThinkingToggle('openai')).toBe(false);
    expect(supportsThinkingToggle('local')).toBe(false);
  });
});

describe('isCloudProvider', () => {
  it('is true for every preset key', () => {
    for (const key of Object.keys(CLOUD_PRESETS)) {
      expect(isCloudProvider(key)).toBe(true);
    }
  });
  it("is false for 'local' and bogus values", () => {
    expect(isCloudProvider('local')).toBe(false);
    expect(isCloudProvider('nope')).toBe(false);
  });
});
