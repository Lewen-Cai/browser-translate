import { describe, it, expect } from 'vitest';
import {
  enabledProviders,
  isProviderReady,
  llmRequestConfig,
  resolveRequestedProvider,
} from './resolve';
import { createDefaultProviders } from '~/storage/defaults';
import type { ProviderConfig } from '~/storage/schema';

const row = (patch: Partial<ProviderConfig> = {}): ProviderConfig => ({
  baseUrl: 'https://api.example.com/v1',
  apiKey: 'sk-x',
  model: 'm',
  enabled: true,
  ...patch,
});

describe('llmRequestConfig', () => {
  it('passes the stored credentials through', () => {
    expect(llmRequestConfig('openai', row())).toEqual({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-x',
      model: 'm',
    });
  });

  it("carries Anthropic's browser opt-in, which the user never types", () => {
    // Without this header the request is refused before JS can read it.
    expect(llmRequestConfig('anthropic', row()).customHeaders).toEqual({
      'anthropic-dangerous-direct-browser-access': 'true',
    });
  });

  it('sends no headers for a provider that needs none', () => {
    expect(llmRequestConfig('gemini', row()).customHeaders).toBeUndefined();
  });

  it('copies the header object rather than sharing the registry entry', () => {
    const a = llmRequestConfig('anthropic', row()).customHeaders;
    const b = llmRequestConfig('anthropic', row()).customHeaders;
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('spells thinking control the way this vendor wants it', () => {
    expect(llmRequestConfig('anthropic', row({ thinking: 'off' })).extraBody).toEqual({
      thinking: { type: 'disabled' },
    });
    expect(llmRequestConfig('gemini', row({ thinking: 'off' })).extraBody).toEqual({
      reasoning_effort: 'none',
    });
  });

  it('treats a missing thinking value as off', () => {
    expect(llmRequestConfig('deepseek', row()).extraBody).toEqual({
      thinking: { type: 'disabled' },
    });
  });

  it('omits extraBody entirely for a provider with no known control', () => {
    expect(llmRequestConfig('openai', row({ thinking: 'high' }))).not.toHaveProperty('extraBody');
    expect(llmRequestConfig('mistral', row({ thinking: 'off' }))).not.toHaveProperty('extraBody');
  });
});

describe('isProviderReady', () => {
  it('is always true for a free service, which has nothing to configure', () => {
    expect(isProviderReady('microsoft', undefined)).toBe(true);
    expect(isProviderReady('google', row({ baseUrl: '', model: '' }))).toBe(true);
  });

  it('needs an endpoint, a model and a key from a cloud model', () => {
    expect(isProviderReady('openai', row())).toBe(true);
    expect(isProviderReady('openai', row({ apiKey: '' }))).toBe(false);
    expect(isProviderReady('openai', row({ model: '' }))).toBe(false);
    expect(isProviderReady('openai', row({ baseUrl: '' }))).toBe(false);
  });

  it('does not ask a self-hosted runtime for a key', () => {
    expect(isProviderReady('local', row({ apiKey: '' }))).toBe(true);
    expect(isProviderReady('local', row({ apiKey: '', model: '' }))).toBe(false);
  });

  it('is false for a model with no row at all', () => {
    expect(isProviderReady('anthropic', undefined)).toBe(false);
  });
});

describe('enabledProviders', () => {
  it('lists what is switched on, in registry order', () => {
    const providers = createDefaultProviders();
    providers.anthropic.enabled = true;
    providers.deepseek.enabled = true;
    expect(enabledProviders(providers)).toEqual([
      'microsoft',
      'google',
      'anthropic',
      'deepseek',
    ]);
  });

  it('starts with only the free services', () => {
    expect(enabledProviders(createDefaultProviders())).toEqual(['microsoft', 'google']);
  });
});

describe('resolveRequestedProvider', () => {
  const providers = createDefaultProviders();
  providers.anthropic.enabled = true;

  it('uses routing when the request named nobody', () => {
    expect(resolveRequestedProvider(undefined, 'microsoft', providers)).toBe('microsoft');
  });

  it('honours a provider that is switched on', () => {
    expect(resolveRequestedProvider('anthropic', 'microsoft', providers)).toBe('anthropic');
  });

  it('falls back to routing for one that has since been switched off', () => {
    expect(resolveRequestedProvider('deepseek', 'microsoft', providers)).toBe('microsoft');
  });

  it('ignores a name the registry does not know', () => {
    expect(resolveRequestedProvider('yahoo-babelfish', 'google', providers)).toBe('google');
  });

  it('keeps the routed provider even when it is not separately enabled', () => {
    // Routing may point at something the Providers page has since switched off;
    // that is routing's problem to report, not a reason to swap providers here.
    const off = createDefaultProviders();
    off.microsoft.enabled = false;
    expect(resolveRequestedProvider('microsoft', 'microsoft', off)).toBe('microsoft');
  });
});
