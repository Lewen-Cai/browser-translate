import { describe, it, expect } from 'vitest';
import { migrateAppData } from './migrations';
import { APP_DATA_VERSION } from './schema';
import type { AppData, ApiSettings, GlobalSettings } from './schema';
import { createDefaultAppData } from './defaults';
import { parseCustomTheme } from '~/core/theme/themes';
import { THEME_TOKEN_KEYS } from './schema';

const baseSettings = {
  targetLanguage: 'en',
  triggerMode: 'icon' as const,
  hotkey: 'Alt+T',
  fullPageHotkey: 'Alt+A',
  cacheEnabled: true,
  cacheTTLDays: 30,
  theme: 'auto' as const,
  themeId: 'cobalt',
  customThemes: [],
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

describe('theme settings integrity repair', () => {
  it('fills missing themeId and customThemes with defaults', () => {
    const data = createDefaultAppData();
    delete (data.settings as Partial<GlobalSettings>).themeId;
    delete (data.settings as Partial<GlobalSettings>).customThemes;
    const out = migrateAppData(data);
    expect(out.settings.themeId).toBe('cobalt');
    expect(out.settings.customThemes).toEqual([]);
  });

  it('clamps a stale themeId back to cobalt', () => {
    const data = createDefaultAppData();
    data.settings.themeId = 'custom-deleted-theme';
    const out = migrateAppData(data);
    expect(out.settings.themeId).toBe('cobalt');
  });

  it('keeps a valid built-in themeId', () => {
    const data = createDefaultAppData();
    data.settings.themeId = 'sepia';
    expect(migrateAppData(data).settings.themeId).toBe('sepia');
  });

  it('drops malformed customThemes entries and keeps a themeId that matches a valid one', () => {
    const data = createDefaultAppData();
    const valid = parseCustomTheme({
      name: 'Mine',
      colors: { light: Object.fromEntries(THEME_TOKEN_KEYS.map((k) => [k, '1 2 3'])) },
    });
    data.settings.customThemes = [valid, { id: 'broken' } as never];
    data.settings.themeId = valid.id;
    const out = migrateAppData(data);
    expect(out.settings.customThemes).toEqual([valid]);
    expect(out.settings.themeId).toBe(valid.id);
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
