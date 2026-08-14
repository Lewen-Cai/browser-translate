import { describe, it, expect } from 'vitest';
import { translationAttribution } from './attribution';
import type { ProviderConfig } from '~/storage/schema';

const cfg = (patch: Partial<ProviderConfig> = {}): ProviderConfig => ({
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: 'k',
  model: 'deepseek-chat',
  enabled: true,
  ...patch,
});

describe('translationAttribution', () => {
  it('credits a free service by its own name — it has no model to name', () => {
    expect(translationAttribution('microsoft', cfg())).toEqual({
      iconId: 'microsoft',
      label: 'Microsoft Translator',
    });
    expect(translationAttribution('google', cfg()).label).toBe('Google Translate');
  });

  it('credits a model by the model name, which is what the reader chose', () => {
    expect(translationAttribution('anthropic', cfg({ model: 'claude-opus-5' }))).toEqual({
      iconId: 'anthropic',
      label: 'claude-opus-5',
    });
  });

  it('falls back to the vendor when a model name is missing', () => {
    expect(translationAttribution('gemini', cfg({ model: '' })).label).toBe('Gemini');
  });

  it('names nothing for a runtime or an endpoint with no brand behind it', () => {
    expect(translationAttribution('local', cfg({ model: '' })).label).toBe('');
    expect(translationAttribution('custom', cfg({ model: '' })).label).toBe('');
    // A model name is still the better answer when there is one.
    expect(translationAttribution('local', cfg({ model: 'qwen3-8b' })).label).toBe('qwen3-8b');
  });

  it('survives a provider with no stored row at all', () => {
    expect(translationAttribution('openai', undefined).label).toBe('OpenAI');
    expect(translationAttribution('microsoft', undefined).label).toBe('Microsoft Translator');
  });
});
