import { describe, it, expect } from 'vitest';
import {
  CLOUD_PRESETS,
  inferCloudProvider,
  isCloudProvider,
  baseUrlHint,
  type CloudProvider,
} from './presets';

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
