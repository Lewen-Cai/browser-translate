import { describe, it, expect } from 'vitest';
import { resolveLocale } from './resolveLocale';

describe('resolveLocale', () => {
  it('passes through an explicit locale setting', () => {
    expect(resolveLocale('ja', 'en-US')).toBe('ja');
    expect(resolveLocale('zh-TW', 'en-US')).toBe('zh-TW');
    expect(resolveLocale('de', 'fr-FR')).toBe('de');
  });

  it('maps auto + Traditional Chinese browser langs to zh-TW', () => {
    expect(resolveLocale('auto', 'zh-TW')).toBe('zh-TW');
    expect(resolveLocale('auto', 'zh-HK')).toBe('zh-TW');
    expect(resolveLocale('auto', 'zh-Hant')).toBe('zh-TW');
  });

  it('maps auto + other Chinese to zh-CN', () => {
    expect(resolveLocale('auto', 'zh-CN')).toBe('zh-CN');
    expect(resolveLocale('auto', 'zh')).toBe('zh-CN');
  });

  it('maps auto + single-language browser langs', () => {
    expect(resolveLocale('auto', 'ja')).toBe('ja');
    expect(resolveLocale('auto', 'ko-KR')).toBe('ko');
    expect(resolveLocale('auto', 'es-MX')).toBe('es');
    expect(resolveLocale('auto', 'fr-CA')).toBe('fr');
    expect(resolveLocale('auto', 'de-AT')).toBe('de');
  });

  it.each([
    ['pt-BR', 'pt-BR'], ['pt-PT', 'pt-BR'], ['it-IT', 'it'], ['ru-RU', 'ru'],
    ['tr-TR', 'tr'], ['vi-VN', 'vi'], ['id-ID', 'id'],
  ])('resolves new browser locale %s to %s', (browser, expected) => {
    expect(resolveLocale('auto', browser)).toBe(expected);
    expect(resolveLocale(expected, 'en-US')).toBe(expected);
  });

  it('falls back to en for unknown or missing browser lang', () => {
    expect(resolveLocale('auto', 'xx-XX')).toBe('en');
    expect(resolveLocale('auto', '')).toBe('en');
    expect(resolveLocale('auto', 'en-GB')).toBe('en');
  });
});
