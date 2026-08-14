import { describe, it, expect } from 'vitest';
import { exportAppData, importAppData, EXPORT_FORMAT, ImportError } from './transfer';
import { createDefaultAppData } from './defaults';
import type { AppData } from './schema';

function sample(): AppData {
  const d = createDefaultAppData();
  d.providers.openai = {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-openai',
    model: 'gpt-4o',
    enabled: true,
  };
  d.providers.anthropic = {
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: 'sk-ant',
    model: 'claude-opus-5',
    enabled: true,
  };
  d.settings.targetLanguage = 'en';
  d.settings.engines = { selection: 'anthropic', fullPage: 'google', subtitle: 'microsoft' };
  return d;
}

describe('exportAppData', () => {
  it('strips every key by default, from every provider', () => {
    const file = exportAppData(sample(), { includeKeys: false }, 123);
    expect(file.format).toBe(EXPORT_FORMAT);
    expect(file.exportedAt).toBe(123);
    expect(file.data.providers.openai.apiKey).toBe('');
    expect(file.data.providers.anthropic.apiKey).toBe('');
    // Everything else about the row survives.
    expect(file.data.providers.openai.model).toBe('gpt-4o');
    expect(file.data.providers.anthropic.enabled).toBe(true);
  });

  it('keeps keys when includeKeys is true', () => {
    const file = exportAppData(sample(), { includeKeys: true }, 123);
    expect(file.data.providers.openai.apiKey).toBe('sk-openai');
    expect(file.data.providers.anthropic.apiKey).toBe('sk-ant');
  });

  it('does not mutate the store it exported from', () => {
    const data = sample();
    exportAppData(data, { includeKeys: false }, 123);
    expect(data.providers.openai.apiKey).toBe('sk-openai');
  });
});

describe('importAppData', () => {
  it('rejects a non-object', () => {
    expect(() => importAppData(null)).toThrow(ImportError);
    expect(() => importAppData(42)).toThrow(ImportError);
  });

  it('rejects an unrecognized format', () => {
    expect(() => importAppData({ format: 'something-else', version: 1, data: {} })).toThrow(
      ImportError,
    );
  });

  it('rejects a file with an unsupported version', () => {
    expect(() => importAppData({ format: EXPORT_FORMAT, version: 99, data: {} })).toThrow(
      ImportError,
    );
  });

  it('rejects a file missing the data object', () => {
    expect(() => importAppData({ format: EXPORT_FORMAT, version: 1 })).toThrow(ImportError);
  });

  it('round-trips providers, routing and settings', () => {
    const exported = exportAppData(sample(), { includeKeys: true }, 123);
    const imported = importAppData(JSON.parse(JSON.stringify(exported)));
    expect(imported.settings.targetLanguage).toBe('en');
    expect(imported.settings.engines).toEqual({
      selection: 'anthropic',
      fullPage: 'google',
      subtitle: 'microsoft',
    });
    expect(imported.providers.anthropic.model).toBe('claude-opus-5');
    expect(imported.providers.anthropic.apiKey).toBe('sk-ant');
  });

  it('fills defaults for fields missing from the file', () => {
    const imported = importAppData({
      format: EXPORT_FORMAT,
      version: 1,
      exportedAt: 0,
      data: { settings: { targetLanguage: 'fr' } },
    });
    expect(imported.settings.targetLanguage).toBe('fr');
    expect(imported.settings.theme).toBe('auto'); // default filled
    expect(imported.providers.microsoft.enabled).toBe(true);
  });

  it('imports a pre-v0.2.0 file, turning its single api into rows', () => {
    // The old shape goes through the same migration a stored profile of that
    // vintage does, so there is no second code path to keep correct.
    const legacyFile = {
      format: EXPORT_FORMAT,
      version: 1,
      exportedAt: 0,
      data: {
        api: {
          baseUrl: 'https://api.deepseek.com/v1',
          apiKey: 'sk-x',
          model: 'deepseek-chat',
          providerType: 'cloud',
          cloudProvider: 'deepseek',
          promptTemplateId: 'builtin-academic', // < v0.1.8 leftover
          savedConfigs: {
            openai: { baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-o', model: 'gpt-4o' },
          },
        },
        settings: { targetLanguage: 'ja', engine: 'llm' },
        promptTemplates: [{ id: 'user-1', name: 'Mine' }],
      },
    };
    const imported = importAppData(legacyFile);
    expect(imported.settings.targetLanguage).toBe('ja');
    expect(imported.providers.deepseek.model).toBe('deepseek-chat');
    expect(imported.providers.deepseek.enabled).toBe(true);
    // The remembered second vendor becomes a row of its own rather than being lost.
    expect(imported.providers.openai.model).toBe('gpt-4o');
    // "the model" resolves to the one it was actually using.
    expect(imported.settings.engines.selection).toBe('deepseek');
    expect('api' in imported).toBe(false);
    expect('promptTemplates' in imported).toBe(false);
  });
});
