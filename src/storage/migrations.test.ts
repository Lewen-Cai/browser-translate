import { describe, it, expect } from 'vitest';
import { migrateAppData } from './migrations';
import { APP_DATA_VERSION } from './schema';
import type { AppData, ApiSettings, GlobalSettings } from './schema';
import { createDefaultAppData } from './defaults';

const baseSettings = {
  engine: 'llm' as const,
  targetLanguage: 'en',
  triggerMode: 'icon' as const,
  hotkey: 'Alt+T',
  fullPageHotkey: 'Alt+A',
  cacheEnabled: true,
  cacheTTLDays: 30,
  subtitleOffsetPct: 0.11,
  subtitleFontScale: 100,
  subtitleBackgroundOpacity: 78,
  subtitleTranslationOnly: false,
  theme: 'auto' as const,
  uiLanguage: 'auto' as const,
};

describe('migrateAppData', () => {
  it('returns data unchanged (same reference) when shape is valid', () => {
    const input: AppData = {
      version: APP_DATA_VERSION,
      api: {
        baseUrl: 'http://x', apiKey: 'k', model: 'm',
        providerType: 'cloud',
        cloudProvider: 'custom',
        savedConfigs: { custom: { baseUrl: 'http://x', apiKey: 'k', model: 'm' } },
      },
      settings: baseSettings,
    };
    // Identity matters: loadAppData writes storage back when the reference changes.
    expect(migrateAppData(input)).toBe(input);
  });

  it('throws on unknown future version', () => {
    expect(() => migrateAppData({ version: 99 } as never)).toThrow();
  });

  it('fills providerType and cloudProvider defaults when missing', () => {
    const input = {
      version: APP_DATA_VERSION,
      api: {
        baseUrl: 'http://x', apiKey: 'k', model: 'm',
        // providerType and cloudProvider absent (v0.1.0 data shape)
      } as unknown as AppData['api'],
      settings: baseSettings,
    } as AppData;
    const out = migrateAppData(input);
    expect(out.api.providerType).toBe('cloud');
    expect(out.api.cloudProvider).toBe('custom');
  });

  it('infers cloudProvider from baseUrl on v0.1.0 upgrade', () => {
    const input = {
      version: APP_DATA_VERSION,
      api: {
        baseUrl: 'https://api.openai.com/v1', apiKey: 'k', model: 'm',
        // providerType + cloudProvider absent
      } as unknown as AppData['api'],
      settings: baseSettings,
    } as AppData;
    const out = migrateAppData(input);
    expect(out.api.providerType).toBe('cloud');
    expect(out.api.cloudProvider).toBe('openai');
  });

  it('preserves a new-provider cloudProvider value (e.g. moonshot)', () => {
    const input: AppData = {
      version: APP_DATA_VERSION,
      api: {
        baseUrl: 'https://api.moonshot.cn/v1', apiKey: 'k', model: 'm',
        providerType: 'cloud',
        cloudProvider: 'moonshot',
      },
      settings: baseSettings,
    };
    expect(migrateAppData(input).api.cloudProvider).toBe('moonshot');
  });

  it('keeps a new-provider value even when baseUrl would not infer it', () => {
    const input: AppData = {
      version: APP_DATA_VERSION,
      api: {
        baseUrl: 'https://my-proxy.example/v1', apiKey: 'k', model: 'm',
        providerType: 'cloud',
        cloudProvider: 'mistral',
      },
      settings: baseSettings,
    };
    expect(migrateAppData(input).api.cloudProvider).toBe('mistral');
  });
});

describe('legacy template-field stripping', () => {
  it('removes promptTemplates and api.promptTemplateId from pre-v0.1.8 data', () => {
    const legacy = {
      version: APP_DATA_VERSION,
      api: {
        baseUrl: 'http://x', apiKey: 'k', model: 'm',
        providerType: 'cloud', cloudProvider: 'custom',
        savedConfigs: { custom: { baseUrl: 'http://x', apiKey: 'k', model: 'm' } },
        promptTemplateId: 'builtin-general',
      },
      settings: baseSettings,
      promptTemplates: [{ id: 'builtin-general', name: 'General' }],
    } as unknown as AppData;
    const out = migrateAppData(legacy);
    expect('promptTemplates' in out).toBe(false);
    expect('promptTemplateId' in out.api).toBe(false);
    // everything else survives
    expect(out.api.baseUrl).toBe('http://x');
    expect(out.settings.targetLanguage).toBe('en');
  });

  it('is identity on data that has no legacy fields', () => {
    const clean: AppData = {
      version: APP_DATA_VERSION,
      api: {
        baseUrl: 'http://x', apiKey: 'k', model: 'm',
        providerType: 'cloud', cloudProvider: 'custom',
        savedConfigs: { custom: { baseUrl: 'http://x', apiKey: 'k', model: 'm' } },
      },
      settings: baseSettings,
    };
    expect(migrateAppData(clean)).toBe(clean);
  });
});

describe('savedConfigs seeding', () => {
  it('seeds the active slot from the active fields when missing', () => {
    const data = createDefaultAppData();
    data.api = { ...data.api, providerType: 'cloud', cloudProvider: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-x', model: 'gpt-4o' };
    delete data.api.savedConfigs;
    const out = migrateAppData(data);
    expect(out.api.savedConfigs).toEqual({ openai: { baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-x', model: 'gpt-4o' } });
  });

  it('leaves a valid savedConfigs untouched', () => {
    const data = createDefaultAppData();
    data.api = { ...data.api, providerType: 'cloud', cloudProvider: 'openai', baseUrl: 'b', apiKey: 'k', model: 'm', savedConfigs: { openai: { baseUrl: 'b', apiKey: 'k', model: 'm' } } };
    const out = migrateAppData(data);
    expect(out.api.savedConfigs).toEqual({ openai: { baseUrl: 'b', apiKey: 'k', model: 'm' } });
  });

  it('drops malformed entries and keeps the active slot', () => {
    const data = createDefaultAppData();
    data.api = {
      ...data.api,
      providerType: 'cloud', cloudProvider: 'openai', baseUrl: 'b', apiKey: 'k', model: 'm',
      savedConfigs: { openai: { baseUrl: 'b', apiKey: 'k', model: 'm' }, deepseek: { baseUrl: 123 } } as unknown as ApiSettings['savedConfigs'],
    };
    const out = migrateAppData(data);
    expect(out.api.savedConfigs).toEqual({ openai: { baseUrl: 'b', apiKey: 'k', model: 'm' } });
  });

  it("preserves a slot's thinking value and drops an invalid one", () => {
    const data = createDefaultAppData();
    data.api = {
      ...data.api,
      providerType: 'cloud', cloudProvider: 'deepseek', baseUrl: 'b', apiKey: 'k', model: 'm', thinking: 'xhigh',
      savedConfigs: {
        deepseek: { baseUrl: 'b', apiKey: 'k', model: 'm', thinking: 'xhigh' },
        openai: { baseUrl: 'o', apiKey: 'k2', model: 'm2', thinking: 'bogus' },
      } as unknown as ApiSettings['savedConfigs'],
    };
    const out = migrateAppData(data);
    expect(out.api.savedConfigs?.deepseek?.thinking).toBe('xhigh');
    expect(out.api.savedConfigs?.openai?.thinking).toBeUndefined();
    expect(out.api.savedConfigs?.openai?.model).toBe('m2');
  });
});

describe('thinking normalization', () => {
  it('drops an invalid api.thinking value (including the retired auto)', () => {
    for (const bad of ['sometimes', 'auto']) {
      const data = createDefaultAppData();
      (data.api as { thinking?: unknown }).thinking = bad;
      const out = migrateAppData(data);
      expect('thinking' in out.api, bad).toBe(false);
    }
  });

  it('keeps every valid api.thinking value', () => {
    for (const good of ['off', 'low', 'medium', 'high', 'xhigh', 'max'] as const) {
      const data = createDefaultAppData();
      data.api.thinking = good;
      expect(migrateAppData(data).api.thinking).toBe(good);
    }
  });
});

describe('fullPageHotkey integrity repair', () => {
  it('fills a missing fullPageHotkey with the default', () => {
    const data = createDefaultAppData();
    delete (data.settings as Partial<GlobalSettings>).fullPageHotkey;
    const out = migrateAppData(data);
    expect(out.settings.fullPageHotkey).toBe('Alt+A');
  });

  it('keeps a user-customised fullPageHotkey', () => {
    const data = createDefaultAppData();
    data.settings.fullPageHotkey = 'Ctrl+Shift+P';
    const out = migrateAppData(data);
    expect(out.settings.fullPageHotkey).toBe('Ctrl+Shift+P');
  });
});

describe('engine integrity repair', () => {
  it('keeps a store that already translates through an API on the LLM engine', () => {
    const data = createDefaultAppData();
    data.api = { ...data.api, baseUrl: 'https://api.deepseek.com/v1', apiKey: 'k', model: 'deepseek-chat' };
    delete (data.settings as Partial<GlobalSettings>).engine;
    expect(migrateAppData(data).settings.engine).toBe('llm');
  });

  it('falls back to a free engine when nothing was ever configured', () => {
    const data = createDefaultAppData();
    data.api = { ...data.api, baseUrl: '', apiKey: '', model: '' };
    delete (data.settings as Partial<GlobalSettings>).engine;
    expect(migrateAppData(data).settings.engine).toBe('microsoft');
  });

  it('replaces an unknown engine value', () => {
    const data = createDefaultAppData();
    (data.settings as { engine: unknown }).engine = 'yandex';
    expect(migrateAppData(data).settings.engine).toBe('microsoft');
  });

  it('preserves a valid engine choice without rewriting storage', () => {
    const seed = createDefaultAppData();
    seed.settings.engine = 'google';
    // Normalize first (a fresh default still needs savedConfigs seeded), then
    // assert the second pass is a no-op — identity is what stops a write loop.
    const normalized = migrateAppData(seed);
    expect(migrateAppData(normalized)).toBe(normalized);
    expect(normalized.settings.engine).toBe('google');
  });
});
