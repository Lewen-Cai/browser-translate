import { describe, expect, it } from 'vitest';
import { filterLanguages, foldSearch, languageChoices } from './search';

const choices = languageChoices('zh-CN');
const find = (query: string) => filterLanguages(choices, query).map((l) => l.code);

describe('language search', () => {
  it('matches endonyms, English and localized names', () => {
    expect(find('日本語')).toEqual(['ja']);
    expect(find('Japanese')).toEqual(['ja']);
    expect(find('日语')).toEqual(['ja']);
    expect(find('英语')).toEqual(['en-AU', 'en-GB', 'en-US']);
  });
  it('names Chinese scripts rather than countries in every interface language', () => {
    const english = languageChoices('en');
    expect(english.find((l) => l.code === 'zh-CN')!.localized).toBe('Chinese (Simplified)');
    expect(english.find((l) => l.code === 'zh-TW')!.localized).toBe('Chinese (Traditional)');
    expect(choices.find((l) => l.code === 'zh-TW')!.localized).not.toContain('台湾');
  });
  it('matches regions by aliases and language tags', () => {
    expect(find('uk')).toContain('en-GB');
    expect(find('british')).toEqual(['en-GB']);
    expect(find('美式')).toEqual(['en-US']);
    expect(find('澳式')).toEqual(['en-AU']);
    expect(find('en-AU')).toEqual(['en-AU']);
    expect(find('English Australia')).toEqual(['en-AU']);
  });
  it('folds Latin accents without corrupting other scripts', () => {
    expect(find('Francais')).toEqual(['fr']);
    expect(find('Tieng Viet')).toEqual(['vi']);
    expect(foldSearch('हिन्दी')).toBe('हिन्दी');
  });
  it('returns all entries for whitespace and none for an unknown name', () => {
    expect(find('   ')).toHaveLength(56);
    expect(find('not-a-language')).toEqual([]);
  });
});
