import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PROVIDER,
  effectiveRouteKey,
  normalizeEngineRouting,
  parseRouteKey,
  routeConfig,
  routeKey,
  usesModel,
} from './routing';
import { createDefaultProviders } from '~/storage/defaults';
import type { EngineRouting } from '~/storage/schema';

const table = (selection = 'microsoft', fullPage = 'microsoft', subtitle = 'microsoft') =>
  ({
    selection: { provider: selection },
    fullPage: { provider: fullPage },
    subtitle: { provider: subtitle },
  }) as EngineRouting;

describe('normalizeEngineRouting', () => {
  it('returns its input reference when already clean', () => {
    const input = table('deepseek', 'google', 'microsoft');
    expect(normalizeEngineRouting(input, 'microsoft')).toBe(input);
  });

  it('keeps a clean route that names a model', () => {
    const input = { ...table(), selection: { provider: 'openrouter', model: 'x/y:free' } } as EngineRouting;
    expect(normalizeEngineRouting(input, 'microsoft')).toBe(input);
  });

  it('lifts pre-v0.2.3 provider ids into routes with no model', () => {
    const out = normalizeEngineRouting(
      { selection: 'deepseek', fullPage: 'google', subtitle: 'microsoft' },
      'microsoft',
    );
    expect(out).toEqual(table('deepseek', 'google', 'microsoft'));
  });

  it('drops a model from a service route and an empty model from any route', () => {
    const out = normalizeEngineRouting(
      {
        selection: { provider: 'google', model: 'x' },
        fullPage: { provider: 'openai', model: '  ' },
        subtitle: { provider: 'openai', model: ' gpt ' },
      },
      'microsoft',
    );
    expect(out).toEqual({
      selection: { provider: 'google' },
      fullPage: { provider: 'openai' },
      subtitle: { provider: 'openai', model: 'gpt' },
    });
  });

  it('seeds every surface from the fallback when there is nothing stored', () => {
    expect(normalizeEngineRouting(undefined, 'anthropic')).toEqual(
      table('anthropic', 'anthropic', 'anthropic'),
    );
    expect(normalizeEngineRouting(null, 'google')).toEqual(table('google', 'google', 'google'));
  });

  it('fills only the surfaces that are missing or invalid', () => {
    const out = normalizeEngineRouting(
      { selection: { provider: 'gemini' }, fullPage: { provider: 'nonsense' } },
      'google',
    );
    expect(out).toEqual(table('gemini', 'google', 'google'));
  });

  it('drops keys that are not surfaces', () => {
    const input = { ...table('opencode', 'opencode', 'opencode'), old: 'x' };
    const out = normalizeEngineRouting(input, 'microsoft');
    expect(out).not.toBe(input);
    expect(Object.keys(out).sort()).toEqual(['fullPage', 'selection', 'subtitle']);
  });

  it('falls back to the default provider when the fallback itself is unusable', () => {
    expect(normalizeEngineRouting(undefined, 'bogus' as never)).toEqual(
      table(DEFAULT_PROVIDER, DEFAULT_PROVIDER, DEFAULT_PROVIDER),
    );
  });

  it('rejects a primitive standing in for the table', () => {
    expect(normalizeEngineRouting('deepseek', 'google')).toEqual(
      table('google', 'google', 'google'),
    );
  });
});

describe('usesModel', () => {
  it('is true when any single surface uses a model', () => {
    expect(usesModel(table('microsoft', 'microsoft', 'anthropic'))).toBe(true);
    expect(usesModel(table('local', 'google', 'google'))).toBe(true);
  });

  it('is false when every surface uses a free service', () => {
    expect(usesModel(table('microsoft', 'google', 'microsoft'))).toBe(false);
  });
});

describe('routeConfig', () => {
  const providers = createDefaultProviders();
  providers.openrouter = { ...providers.openrouter, model: 'a', models: ['a', 'b'], apiKey: 'k' };

  it('serves a route with the model it names', () => {
    expect(routeConfig({ provider: 'openrouter', model: 'b' }, providers).model).toBe('b');
  });

  it('uses the default for no model or a removed one, without copying the row', () => {
    expect(routeConfig({ provider: 'openrouter' }, providers)).toBe(providers.openrouter);
    expect(routeConfig({ provider: 'openrouter', model: 'gone' }, providers)).toBe(providers.openrouter);
  });

  it('returns a service row as is', () => {
    expect(routeConfig({ provider: 'google' }, providers)).toBe(providers.google);
  });
});

describe('route keys', () => {
  it('round-trips, including a model name containing the separator', () => {
    for (const route of [
      { provider: 'google' as const },
      { provider: 'openrouter' as const, model: 'deepseek/deepseek-r1:free' },
      { provider: 'custom' as const, model: 'a|b' },
    ]) {
      expect(parseRouteKey(routeKey(route))).toEqual(route);
    }
  });

  it('rejects an unknown provider', () => {
    expect(parseRouteKey('nope|x')).toBeNull();
  });

  it('shows the model a route really uses as selected', () => {
    const providers = createDefaultProviders();
    providers.openai = { ...providers.openai, model: 'a', models: ['a', 'b'] };
    expect(effectiveRouteKey({ provider: 'openai' }, providers)).toBe('openai|a');
    expect(effectiveRouteKey({ provider: 'openai', model: 'b' }, providers)).toBe('openai|b');
    expect(effectiveRouteKey({ provider: 'openai', model: 'gone' }, providers)).toBe('openai|a');
    expect(effectiveRouteKey({ provider: 'microsoft' }, providers)).toBe('microsoft');
  });
});
