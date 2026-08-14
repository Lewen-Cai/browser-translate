import { describe, it, expect } from 'vitest';
import { migrateAppData } from './migrations';
import { APP_DATA_VERSION } from './schema';
import type { AppData, GlobalSettings } from './schema';
import { createDefaultAppData } from './defaults';
import { PROVIDER_IDS } from '~/core/providers/registry';

/**
 * A store shaped the way v0.1.9 wrote one: a single `api` plus per-vendor
 * `savedConfigs`, and one `engine` for every surface.
 */
function legacyStore(api: Record<string, unknown> = {}, settings: Record<string, unknown> = {}) {
  const base = createDefaultAppData();
  const { providers: _providers, ...rest } = base;
  const { engines: _engines, ...restSettings } = base.settings;
  return {
    ...rest,
    api: {
      baseUrl: '',
      apiKey: '',
      model: '',
      providerType: 'cloud',
      cloudProvider: 'custom',
      ...api,
    },
    settings: { ...restSettings, ...settings },
  } as unknown as AppData;
}

describe('migrateAppData', () => {
  it('returns data unchanged (same reference) when shape is valid', () => {
    const input = createDefaultAppData();
    // Identity matters: loadAppData writes storage back when the reference changes.
    expect(migrateAppData(input)).toBe(input);
  });

  it('throws on unknown future version', () => {
    expect(() => migrateAppData({ version: 99 } as never)).toThrow();
  });
});

describe('adopting the provider table', () => {
  it('gives every registered provider a row', () => {
    const out = migrateAppData(legacyStore());
    expect(Object.keys(out.providers).sort()).toEqual([...PROVIDER_IDS].sort());
  });

  it('drops the legacy api object once it has been read', () => {
    const out = migrateAppData(legacyStore({ model: 'm', baseUrl: 'b', apiKey: 'k' }));
    expect('api' in out).toBe(false);
  });

  it("moves the active vendor's live fields into its own row", () => {
    const out = migrateAppData(
      legacyStore({
        cloudProvider: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: 'sk-x',
        model: 'deepseek-chat',
        thinking: 'xhigh',
      }),
    );
    expect(out.providers.deepseek).toEqual({
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-x',
      model: 'deepseek-chat',
      thinking: 'xhigh',
      enabled: true,
    });
  });

  it('turns each remembered config into a row of its own', () => {
    // These used to be reachable only by switching the active vendor; now they
    // are providers in their own right.
    const out = migrateAppData(
      legacyStore({
        cloudProvider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-o',
        model: 'gpt-4o',
        savedConfigs: {
          deepseek: { baseUrl: 'https://api.deepseek.com/v1', apiKey: 'sk-d', model: 'chat' },
          mistral: { baseUrl: 'https://api.mistral.ai/v1', apiKey: 'sk-m', model: 'large' },
        },
      }),
    );
    expect(out.providers.deepseek.model).toBe('chat');
    expect(out.providers.mistral.apiKey).toBe('sk-m');
  });

  it('switches on the vendor that was in use, and leaves the rest off', () => {
    const out = migrateAppData(
      legacyStore({
        cloudProvider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-o',
        model: 'gpt-4o',
        savedConfigs: {
          deepseek: { baseUrl: 'https://api.deepseek.com/v1', apiKey: 'sk-d', model: 'chat' },
        },
      }),
    );
    expect(out.providers.openai.enabled).toBe(true);
    expect(out.providers.deepseek.enabled).toBe(false);
    // The free services were always available and stay that way.
    expect(out.providers.microsoft.enabled).toBe(true);
    expect(out.providers.google.enabled).toBe(true);
  });

  it('does not switch on a vendor that was never usable', () => {
    // A half-filled row in routing would be a provider that cannot answer.
    const out = migrateAppData(legacyStore({ cloudProvider: 'openai', apiKey: '', model: '' }));
    expect(out.providers.openai.enabled).toBe(false);
  });

  it('reads a self-hosted store into the local row', () => {
    const out = migrateAppData(
      legacyStore({ providerType: 'local', baseUrl: 'http://localhost:1234/v1', model: 'qwen' }),
    );
    expect(out.providers.local).toMatchObject({ model: 'qwen', enabled: true });
  });

  it('drops an invalid thinking value while keeping the rest of the row', () => {
    for (const bad of ['sometimes', 'auto']) {
      const out = migrateAppData(
        legacyStore({ cloudProvider: 'deepseek', baseUrl: 'b', apiKey: 'k', model: 'm', thinking: bad }),
      );
      expect('thinking' in out.providers.deepseek, bad).toBe(false);
      expect(out.providers.deepseek.model, bad).toBe('m');
    }
  });

  it('keeps every valid thinking value', () => {
    for (const good of ['off', 'low', 'medium', 'high', 'xhigh', 'max'] as const) {
      const out = migrateAppData(
        legacyStore({ cloudProvider: 'deepseek', baseUrl: 'b', apiKey: 'k', model: 'm', thinking: good }),
      );
      expect(out.providers.deepseek.thinking).toBe(good);
    }
  });

  it('repairs a malformed row without touching its neighbours', () => {
    const data = createDefaultAppData();
    data.providers.openai = { baseUrl: 'b', apiKey: 'k', model: 'm', enabled: true };
    (data.providers as Record<string, unknown>).deepseek = { baseUrl: 123 };
    const out = migrateAppData(data);
    expect(out.providers.deepseek).toEqual({
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      model: '',
      enabled: false,
    });
    expect(out.providers.openai).toEqual({ baseUrl: 'b', apiKey: 'k', model: 'm', enabled: true });
  });

  it('fills a row that is missing entirely', () => {
    const data = createDefaultAppData();
    delete (data.providers as Record<string, unknown>).gemini;
    expect(migrateAppData(data).providers.gemini.baseUrl).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai',
    );
  });
});

describe('routing migration', () => {
  it('resolves the abstract "llm" to whatever the store was actually using', () => {
    const out = migrateAppData(
      legacyStore(
        { cloudProvider: 'zhipu', baseUrl: 'b', apiKey: 'k', model: 'm' },
        { engines: { selection: 'llm', fullPage: 'google', subtitle: 'llm' } },
      ),
    );
    expect(out.settings.engines).toEqual({
      selection: 'zhipu',
      fullPage: 'google',
      subtitle: 'zhipu',
    });
  });

  it('carries a v0.1.9 single engine over to every surface', () => {
    const out = migrateAppData(legacyStore({}, { engine: 'google' }));
    expect(out.settings.engines).toEqual({
      selection: 'google',
      fullPage: 'google',
      subtitle: 'google',
    });
  });

  it('drops the legacy engine key once it has been read', () => {
    const out = migrateAppData(legacyStore({}, { engine: 'google' }));
    expect('engine' in out.settings).toBe(false);
  });

  it('replaces a provider we no longer ship', () => {
    const data = createDefaultAppData();
    data.settings.engines = { selection: 'yandex', fullPage: 'google', subtitle: 'google' } as never;
    expect(migrateAppData(data).settings.engines.selection).toBe('microsoft');
  });

  it('preserves a valid routing table without rewriting storage', () => {
    const seed = createDefaultAppData();
    seed.settings.engines = { selection: 'anthropic', fullPage: 'gemini', subtitle: 'microsoft' };
    const normalized = migrateAppData(seed);
    // Identity is what stops a load/write loop through storage.onChanged.
    expect(migrateAppData(normalized)).toBe(normalized);
    expect(normalized.settings.engines.selection).toBe('anthropic');
  });
});

describe('legacy field stripping', () => {
  it('removes promptTemplates from pre-v0.1.8 data', () => {
    const legacy = {
      ...legacyStore({ baseUrl: 'http://x', apiKey: 'k', model: 'm' }),
      promptTemplates: [{ id: 'builtin-general', name: 'General' }],
    } as unknown as AppData;
    const out = migrateAppData(legacy);
    expect('promptTemplates' in out).toBe(false);
    expect(out.providers.custom.baseUrl).toBe('http://x');
  });

  it('removes the theme fields left by v0.1.8', () => {
    const data = createDefaultAppData();
    Object.assign(data.settings, { themeId: 'sepia', customThemes: [] });
    const out = migrateAppData(data);
    expect('themeId' in out.settings).toBe(false);
    expect('customThemes' in out.settings).toBe(false);
  });
});

describe('settings integrity repair', () => {
  it('fills a missing fullPageHotkey with the default', () => {
    const data = createDefaultAppData();
    delete (data.settings as Partial<GlobalSettings>).fullPageHotkey;
    expect(migrateAppData(data).settings.fullPageHotkey).toBe('Alt+A');
  });

  it('keeps a user-customised fullPageHotkey', () => {
    const data = createDefaultAppData();
    data.settings.fullPageHotkey = 'Ctrl+Shift+P';
    expect(migrateAppData(data).settings.fullPageHotkey).toBe('Ctrl+Shift+P');
  });

  it('replaces a target language we no longer offer', () => {
    const data = createDefaultAppData();
    data.settings.targetLanguage = 'klingon';
    expect(migrateAppData(data).settings.targetLanguage).toBe('zh-CN');
  });

  it('keeps a target language that is still on the list', () => {
    const data = createDefaultAppData();
    data.settings.targetLanguage = 'pt-PT';
    expect(migrateAppData(data).settings.targetLanguage).toBe('pt-PT');
  });

  it('accepts a version below the current one', () => {
    const data = { ...createDefaultAppData(), version: APP_DATA_VERSION } as AppData;
    expect(() => migrateAppData(data)).not.toThrow();
  });
});
