import { describe, it, expect } from 'vitest';
import { exportAppData, importAppData, EXPORT_FORMAT, ImportError } from './transfer';
import { createDefaultAppData } from './defaults';
import { parseCustomTheme } from '~/core/theme/themes';
import { THEME_TOKEN_KEYS, type AppData } from './schema';

function sample(): AppData {
  const d = createDefaultAppData();
  d.api.baseUrl = 'https://api.example.com/v1';
  d.api.apiKey = 'sk-secret';
  d.api.model = 'gpt-4o';
  d.api.customHeaders = { Authorization: 'Bearer sk-header-secret' };
  d.api.savedConfigs = { openai: { baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-openai', model: 'gpt-4o' } };
  d.settings.targetLanguage = 'en';
  return d;
}

describe('exportAppData', () => {
  it('strips all api keys by default', () => {
    const file = exportAppData(sample(), { includeKeys: false }, 123);
    expect(file.format).toBe(EXPORT_FORMAT);
    expect(file.exportedAt).toBe(123);
    expect(file.data.api.apiKey).toBe('');
    expect(file.data.api.savedConfigs?.openai?.apiKey).toBe('');
  });

  it('keeps keys when includeKeys is true', () => {
    const file = exportAppData(sample(), { includeKeys: true }, 123);
    expect(file.data.api.apiKey).toBe('sk-secret');
    expect(file.data.api.savedConfigs?.openai?.apiKey).toBe('sk-openai');
  });

  it('strips customHeaders by default (they can carry secrets)', () => {
    const file = exportAppData(sample(), { includeKeys: false }, 123);
    expect(file.data.api.customHeaders).toBeUndefined();
  });

  it('keeps customHeaders when includeKeys is true', () => {
    const file = exportAppData(sample(), { includeKeys: true }, 123);
    expect(file.data.api.customHeaders).toEqual({ Authorization: 'Bearer sk-header-secret' });
  });
});

describe('importAppData', () => {
  it('rejects a non-object', () => {
    expect(() => importAppData(null)).toThrow(ImportError);
    expect(() => importAppData(42)).toThrow(ImportError);
  });

  it('rejects an unrecognized format', () => {
    expect(() => importAppData({ format: 'something-else', version: 1, data: {} })).toThrow(ImportError);
  });

  it('rejects a file with an unsupported version', () => {
    expect(() => importAppData({ format: EXPORT_FORMAT, version: 99, data: {} })).toThrow(ImportError);
  });

  it('rejects a file missing the data object', () => {
    expect(() => importAppData({ format: EXPORT_FORMAT, version: 1 })).toThrow(ImportError);
  });

  it('round-trips settings and api', () => {
    const exported = exportAppData(sample(), { includeKeys: true }, 123);
    const imported = importAppData(JSON.parse(JSON.stringify(exported)));
    expect(imported.settings.targetLanguage).toBe('en');
    expect(imported.api.model).toBe('gpt-4o');
    expect(imported.api.apiKey).toBe('sk-secret');
  });

  it('fills defaults for fields missing from the file', () => {
    const imported = importAppData({ format: EXPORT_FORMAT, version: 1, exportedAt: 0, data: { settings: { targetLanguage: 'fr' } } });
    expect(imported.settings.targetLanguage).toBe('fr');
    expect(imported.settings.theme).toBe('auto'); // default filled
  });

  it('round-trips a custom theme and its selected themeId', () => {
    const custom = parseCustomTheme({
      name: 'Round Trip',
      colors: { light: Object.fromEntries(THEME_TOKEN_KEYS.map((k) => [k, '4 5 6'])) },
    });
    const data = sample();
    data.settings.customThemes = [custom];
    data.settings.themeId = custom.id;
    const exported = exportAppData(data, { includeKeys: false }, 1);
    const imported = importAppData(JSON.parse(JSON.stringify(exported)));
    expect(imported.settings.customThemes).toEqual([custom]);
    expect(imported.settings.themeId).toBe(custom.id);
  });

  it('imports a pre-v0.1.8 file and strips its template fields', () => {
    const legacyFile = {
      format: EXPORT_FORMAT,
      version: 1,
      exportedAt: 0,
      data: {
        api: {
          baseUrl: 'https://api.deepseek.com/v1', apiKey: 'sk-x', model: 'deepseek-chat',
          providerType: 'cloud', cloudProvider: 'deepseek',
          promptTemplateId: 'builtin-academic',
        },
        settings: { targetLanguage: 'ja' },
        promptTemplates: [{
          id: 'user-1', name: 'Mine', isBuiltin: false,
          systemPrompt: 's', userPromptTemplate: 'u', createdAt: 1, updatedAt: 1,
        }],
      },
    };
    const imported = importAppData(legacyFile);
    expect(imported.settings.targetLanguage).toBe('ja');
    expect(imported.api.model).toBe('deepseek-chat');
    expect('promptTemplateId' in imported.api).toBe(false);
    expect('promptTemplates' in imported).toBe(false);
  });
});
