import { describe, it, expect } from 'vitest';
import {
  effectiveRouteKey,
  normalizeEngineRouting,
  parseRouteKey,
  routeProblem,
  routeConfig,
  routeNeedsModel,
  releaseRoutes,
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

  it('leaves every surface unchosen when there is no seed', () => {
    const none = { selection: null, fullPage: null, subtitle: null };
    expect(normalizeEngineRouting(undefined)).toEqual(none);
    expect(normalizeEngineRouting(undefined, 'bogus' as never)).toEqual(none);
    expect(normalizeEngineRouting({ selection: { provider: 'nonsense' } })).toEqual(none);
  });

  it('keeps an unchosen surface unchosen, even with a seed', () => {
    const input = { ...table('openai'), fullPage: null } as EngineRouting;
    expect(normalizeEngineRouting(input, 'google')).toBe(input);
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

  it('is false for surfaces with no engine chosen', () => {
    expect(usesModel({ selection: null, fullPage: null, subtitle: null })).toBe(false);
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

  it('never substitutes another model for one that is missing', () => {
    expect(routeConfig({ provider: 'openrouter' }, providers).model).toBe('');
    expect(routeConfig({ provider: 'openrouter', model: 'gone' }, providers).model).toBe('');
    expect(routeConfig({ provider: 'openrouter', model: 'a' }, providers)).toBe(providers.openrouter);
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

  it('shows the route exactly as stored', () => {
    expect(effectiveRouteKey({ provider: 'openai', model: 'b' })).toBe('openai|b');
    expect(effectiveRouteKey({ provider: 'openai', model: 'gone' })).toBe('openai|gone');
    expect(effectiveRouteKey({ provider: 'microsoft' })).toBe('microsoft');
  });
});

describe('routeProblem', () => {
  const setup = () => {
    const providers = createDefaultProviders();
    providers.openrouter = { ...providers.openrouter, apiKey: 'k', model: 'a', models: ['a', 'b'], enabled: true };
    providers.microsoft.enabled = true;
    return providers;
  };

  it('reports a surface with no engine chosen', () => {
    expect(routeProblem(null, setup())).toBe('unset');
  });

  it('finds nothing wrong with a usable route', () => {
    expect(routeProblem({ provider: 'openrouter', model: 'b' }, setup())).toBeNull();
    expect(routeProblem({ provider: 'microsoft' }, setup())).toBeNull();
  });

  it('reports a switched-off provider, with no fallback — Microsoft included', () => {
    const providers = setup();
    providers.openrouter.enabled = false;
    expect(routeProblem({ provider: 'openrouter', model: 'b' }, providers)).toBe('provider-off');
    providers.microsoft.enabled = false;
    expect(routeProblem({ provider: 'microsoft' }, providers)).toBe('provider-off');
  });

  it('reports a removed model while the provider is on', () => {
    expect(routeProblem({ provider: 'openrouter', model: 'gone' }, setup())).toBe('model-missing');
    expect(routeNeedsModel({ provider: 'openrouter' }, setup())).toBe(true);
    expect(routeNeedsModel({ provider: 'microsoft' }, setup())).toBe(false);
  });
});

describe('releaseRoutes', () => {
  const setup = () => {
    const providers = createDefaultProviders();
    providers.openrouter = { ...providers.openrouter, apiKey: 'k', model: 'a', models: ['a', 'b'], enabled: true };
    providers.microsoft.enabled = true;
    return providers;
  };
  const engines: EngineRouting = {
    selection: { provider: 'openrouter', model: 'a' },
    fullPage: { provider: 'openrouter', model: 'b' },
    subtitle: { provider: 'microsoft' },
  };

  it('returns its input when the provider can still serve every route', () => {
    expect(releaseRoutes(engines, setup(), 'openrouter')).toBe(engines);
  });

  it('clears the routes of a switched-off provider and leaves the rest', () => {
    const providers = setup();
    providers.openrouter.enabled = false;
    expect(releaseRoutes(engines, providers, 'openrouter')).toEqual({
      selection: null, fullPage: null, subtitle: { provider: 'microsoft' },
    });
  });

  it('clears only the route whose model was removed', () => {
    const providers = setup();
    providers.openrouter.models = ['b'];
    expect(releaseRoutes(engines, providers, 'openrouter')).toEqual({ ...engines, selection: null });
  });

  it('leaves other providers alone', () => {
    const providers = setup();
    providers.microsoft.enabled = false;
    expect(releaseRoutes(engines, providers, 'openrouter')).toBe(engines);
  });
});
