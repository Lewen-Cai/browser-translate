import { describe, it, expect } from 'vitest';
import { autoSourceLang, toEngineLang, toEngineSourceLang } from './langCodes';

describe('toEngineLang', () => {
  it('maps Chinese to script subtags for Microsoft', () => {
    expect(toEngineLang('microsoft', 'zh-CN')).toBe('zh-Hans');
    expect(toEngineLang('microsoft', 'zh-TW')).toBe('zh-Hant');
  });

  it('keeps the region form of Chinese for Google', () => {
    expect(toEngineLang('google', 'zh-CN')).toBe('zh-CN');
    expect(toEngineLang('google', 'zh-TW')).toBe('zh-TW');
  });

  it('passes the eight shipped languages through unchanged otherwise', () => {
    for (const code of ['en', 'ja', 'ko', 'es', 'fr', 'de']) {
      expect(toEngineLang('microsoft', code)).toBe(code);
      expect(toEngineLang('google', code)).toBe(code);
    }
  });

  it('falls back to the primary subtag for unlisted regional codes', () => {
    expect(toEngineLang('microsoft', 'pt-BR')).toBe('pt');
    expect(toEngineLang('google', 'pt-BR')).toBe('pt');
  });
});

describe('source language', () => {
  it('uses the engine-specific auto value', () => {
    expect(autoSourceLang('microsoft')).toBe('');
    expect(autoSourceLang('google')).toBe('auto');
  });

  it('treats undefined and the literal "auto" alike', () => {
    expect(toEngineSourceLang('microsoft', undefined)).toBe('');
    expect(toEngineSourceLang('microsoft', 'auto')).toBe('');
    expect(toEngineSourceLang('google', undefined)).toBe('auto');
    expect(toEngineSourceLang('google', 'auto')).toBe('auto');
  });

  it('maps an explicit source language', () => {
    expect(toEngineSourceLang('microsoft', 'zh-CN')).toBe('zh-Hans');
    expect(toEngineSourceLang('google', 'en')).toBe('en');
  });
});
