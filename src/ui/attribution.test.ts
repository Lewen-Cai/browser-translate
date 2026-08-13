import { describe, it, expect } from 'vitest';
import { translationAttribution } from './attribution';
import { createDefaultAppData } from '~/storage/defaults';
import type { ApiSettings } from '~/storage/schema';

function api(over: Partial<ApiSettings> = {}): ApiSettings {
  return { ...createDefaultAppData().api, ...over };
}

describe('translationAttribution', () => {
  it('names the service when a free engine did the work', () => {
    expect(translationAttribution('microsoft', api())).toEqual({
      iconId: 'microsoft', label: 'Microsoft',
    });
    expect(translationAttribution('google', api())).toEqual({
      iconId: 'google', label: 'Google',
    });
  });

  it('names the model when an LLM did the work', () => {
    const result = translationAttribution('llm', api({
      providerType: 'cloud', cloudProvider: 'deepseek', model: 'deepseek-v4-flash',
    }));
    expect(result).toEqual({ iconId: 'deepseek', label: 'deepseek-v4-flash' });
  });

  it('falls back to the provider brand when no model is set', () => {
    const result = translationAttribution('llm', api({
      providerType: 'cloud', cloudProvider: 'mistral', model: '',
    }));
    expect(result).toEqual({ iconId: 'mistral', label: 'Mistral' });
  });

  it('has no brand to fall back to for a local runtime or a custom endpoint', () => {
    expect(translationAttribution('llm', api({ providerType: 'local', model: '' })))
      .toEqual({ iconId: 'local', label: '' });
    expect(translationAttribution('llm', api({ providerType: 'cloud', cloudProvider: 'custom', model: '' })))
      .toEqual({ iconId: 'custom', label: '' });
  });

  it('still reports the model for a local runtime', () => {
    expect(translationAttribution('llm', api({ providerType: 'local', model: 'qwen3-8b' })))
      .toEqual({ iconId: 'local', label: 'qwen3-8b' });
  });
});
