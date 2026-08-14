import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TARGET_LANGUAGE,
  TARGET_LANGUAGES,
  TARGET_LANGUAGE_OPTIONS,
  isTargetLanguage,
  languageName,
} from './targets';
import { toEngineLang } from '~/core/mt/langCodes';
import { MT_ENGINE_IDS } from '~/core/mt/types';

describe('TARGET_LANGUAGES', () => {
  it('has no duplicate codes', () => {
    const codes = TARGET_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('is ordered by English name', () => {
    const names = TARGET_LANGUAGES.map((l) => l.english);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });

  it('fills every field', () => {
    for (const l of TARGET_LANGUAGES) {
      expect(l.code).toMatch(/^[a-z]{2}(-[A-Za-z]{2,4})?$/);
      expect(l.endonym.length).toBeGreaterThan(0);
      expect(l.english.length).toBeGreaterThan(0);
    }
  });

  it('includes the default', () => {
    expect(isTargetLanguage(DEFAULT_TARGET_LANGUAGE)).toBe(true);
  });

  it('offers no code the free engines reject', () => {
    // `iw` is Hebrew's legacy code: Google accepts it, Microsoft answers 400.
    expect(TARGET_LANGUAGES.some((l) => l.code === 'iw')).toBe(false);
    expect(isTargetLanguage('he')).toBe(true);
  });
});

describe('engine code mapping', () => {
  it('maps every target to a non-empty code on every engine', () => {
    for (const engine of MT_ENGINE_IDS) {
      for (const l of TARGET_LANGUAGES) {
        expect(toEngineLang(engine, l.code)).not.toBe('');
      }
    }
  });

  it('keeps European Portuguese distinct from the default Portuguese', () => {
    // Both engines honour pt-PT and really do translate it differently. Without
    // an explicit entry the generic "strip the region" fallback turns it into
    // `pt`, which both engines read as Brazilian — a silently wrong answer.
    for (const engine of MT_ENGINE_IDS) {
      expect(toEngineLang(engine, 'pt-PT')).not.toBe(toEngineLang(engine, 'pt-BR'));
    }
  });

  it('lets Brazilian Portuguese fall back to the primary subtag', () => {
    for (const engine of MT_ENGINE_IDS) {
      expect(toEngineLang(engine, 'pt-BR')).toBe('pt');
    }
  });
});

describe('languageName', () => {
  it('returns the English name for a known code', () => {
    expect(languageName('zh-CN')).toBe('Chinese (Simplified)');
    expect(languageName('nb')).toBe('Norwegian Bokmål');
  });

  it('passes an unknown code through', () => {
    expect(languageName('xx-YY')).toBe('xx-YY');
  });
});

describe('isTargetLanguage', () => {
  it('rejects non-strings and unknown codes', () => {
    expect(isTargetLanguage(undefined)).toBe(false);
    expect(isTargetLanguage(42)).toBe(false);
    expect(isTargetLanguage('klingon')).toBe(false);
  });
});

describe('TARGET_LANGUAGE_OPTIONS', () => {
  it('pairs each code with a label', () => {
    expect(TARGET_LANGUAGE_OPTIONS).toHaveLength(TARGET_LANGUAGES.length);
    expect(TARGET_LANGUAGE_OPTIONS).toContainEqual({
      value: 'zh-CN',
      label: '简体中文 · Chinese (Simplified)',
    });
  });

  it('does not repeat a name that is already English', () => {
    expect(TARGET_LANGUAGE_OPTIONS).toContainEqual({ value: 'en', label: 'English' });
  });
});
