import { describe, it, expect } from 'vitest';
import { engineOptions, routeOptions } from './engineOptions';
import { createDefaultProviders } from '~/storage/defaults';
import type { ProvidersConfig } from '~/storage/schema';

const LABELS = { services: 'Services', models: 'Models' };

function withEnabled(...ids: string[]): ProvidersConfig {
  const providers = createDefaultProviders();
  for (const id of Object.keys(providers)) {
    providers[id as keyof ProvidersConfig].enabled = ids.includes(id);
  }
  return providers;
}

describe('engineOptions', () => {
  it('offers only what is switched on', () => {
    const out = engineOptions(withEnabled('microsoft', 'anthropic'), LABELS);
    expect(out.map((o) => o.value)).toEqual(['microsoft', 'anthropic']);
  });

  it('groups services apart from models and keeps registry order', () => {
    const out = engineOptions(withEnabled('google', 'microsoft', 'deepseek', 'gemini'), LABELS);
    expect(out.map((o) => [o.value, o.group])).toEqual([
      ['microsoft', 'Services'],
      ['google', 'Services'],
      ['gemini', 'Models'],
      ['deepseek', 'Models'],
    ]);
  });

  it('names each option after its vendor, with that vendormark', () => {
    const [claude] = engineOptions(withEnabled('anthropic'), LABELS);
    expect(claude).toEqual({
      value: 'anthropic',
      label: 'Claude',
      iconId: 'anthropic',
      group: 'Models',
    });
  });

  it('keeps a service out of a dictionary picker without being told about services', () => {
    const providers = withEnabled('microsoft', 'google', 'deepseek');
    const out = engineOptions(providers, LABELS, { capability: 'dictionary' });
    expect(out.map((o) => o.value)).toEqual(['deepseek']);
  });

  it('never offers a switched-off provider', () => {
    const out = engineOptions(withEnabled('microsoft'), LABELS);
    expect(out.map((o) => o.value)).toEqual(['microsoft']);
  });

  it('is empty when nothing is enabled', () => {
    expect(engineOptions(withEnabled(), LABELS)).toEqual([]);
  });
});

describe('routeOptions', () => {
  it('offers each kept model of a model provider, and a service once', () => {
    const providers = withEnabled('microsoft', 'openrouter');
    providers.openrouter = { ...providers.openrouter, model: 'a/x', models: ['a/x', 'b/y'] };
    const out = routeOptions(providers, LABELS);
    expect(out.map((o) => [o.value, o.detail])).toEqual([
      ['microsoft', undefined],
      ['openrouter|a/x', 'a/x'],
      ['openrouter|b/y', 'b/y'],
    ]);
  });

  it('offers nothing for a model provider with no models yet', () => {
    expect(routeOptions(withEnabled('openai'), LABELS)).toEqual([]);
  });


});
