import { describe, it, expect } from 'vitest';
import { identifyLanguage, sourceLanguageEndonym } from './identify';
import { TARGET_LANGUAGES } from './targets';

describe('identifyLanguage — scripts', () => {
  it('reads a script that only one language uses', () => {
    expect(identifyLanguage('안녕하세요 반갑습니다')).toBe('ko');
    expect(identifyLanguage('Γειά σου κόσμε')).toBe('el');
    expect(identifyLanguage('שלום עולם')).toBe('he');
    expect(identifyLanguage('नमस्ते दुनिया')).toBe('hi');
    expect(identifyLanguage('สวัสดีชาวโลก')).toBe('th');
    expect(identifyLanguage('হ্যালো বিশ্ব')).toBe('bn');
  });

  it('calls a text with kana Japanese even though it is mostly Han', () => {
    // Japanese borrows the Han characters, so their presence proves nothing;
    // one kana proves the language.
    expect(identifyLanguage('日本語の勉強をしています')).toBe('ja');
    expect(identifyLanguage('东京大学的学生')).not.toBe('ja');
  });

  it('separates the two Chinese scripts by characters written only one way', () => {
    expect(identifyLanguage('这个问题我们还没有发现')).toBe('zh-CN');
    expect(identifyLanguage('這個問題我們還沒有發現')).toBe('zh-TW');
  });

  it('defaults Han with no distinguishing character to Simplified', () => {
    expect(identifyLanguage('中文')).toBe('zh-CN');
  });

  it('separates Ukrainian from Russian by its own letters', () => {
    expect(identifyLanguage('Привет, как дела')).toBe('ru');
    expect(identifyLanguage('Привіт, як справи')).toBe('uk');
  });

  it('separates the Arabic-script languages by their added letters', () => {
    expect(identifyLanguage('مرحبا بالعالم')).toBe('ar');
    expect(identifyLanguage('سلام دنیا چطور')).toBe('fa');
    expect(identifyLanguage('ہیلو دنیا')).toBe('ur');
  });
});

describe('identifyLanguage — Latin script', () => {
  it('reads the everyday words of a sentence', () => {
    expect(identifyLanguage('The quick brown fox jumps over the lazy dog')).toBe('en');
    expect(identifyLanguage('Le renard brun rapide saute par dessus le chien')).toBe('fr');
    expect(identifyLanguage('Der schnelle braune Fuchs ist nicht ein Hund')).toBe('de');
    expect(identifyLanguage('El zorro marrón que salta por encima del perro')).toBe('es');
    expect(identifyLanguage('Il gatto che salta più del cane con il topo')).toBe('it');
    expect(identifyLanguage('Het is een snelle bruine vos en niet de hond')).toBe('nl');
  });

  it('lets one distinctive letter settle a short line', () => {
    expect(identifyLanguage('Příliš žluťoučký kůň')).toBe('cs');
    expect(identifyLanguage('Zażółć gęślą jaźń')).toBe('pl');
    expect(identifyLanguage('Tiếng Việt rất đẹp')).toBe('vi');
    expect(identifyLanguage('Türkçe öğreniyorum')).toBe('tr');
  });

  it('guesses English for a Latin word with nothing else to go on', () => {
    // The reader can see the original beside it, and on the web this is right
    // far more often than not.
    expect(identifyLanguage('serendipity')).toBe('en');
    expect(identifyLanguage('Degraded performance')).toBe('en');
  });

  it('has nothing to say about text with no letters at all', () => {
    expect(identifyLanguage('')).toBeNull();
    expect(identifyLanguage('12345 — 67.8%')).toBeNull();
    expect(identifyLanguage('🙂🙂')).toBeNull();
  });
});

describe('sourceLanguageEndonym', () => {
  it('names every language the identifier can return', () => {
    const seen = new Set<string>();
    const samples = [
      'The quick brown fox', 'Le renard brun saute', 'Der Fuchs ist nicht',
      '这个问题', '這個問題', '日本語です', '안녕하세요', 'Привет как', 'Привіт як',
      'مرحبا بالعالم', 'سلام دنیا چطور', 'ہیلو دنیا', 'שלום עולם', 'नमस्ते दुनिया',
      'สวัสดี', 'হ্যালো', 'Γειά σου', 'Tiếng Việt đẹp', 'Türkçe öğreniyorum',
    ];
    for (const s of samples) {
      const code = identifyLanguage(s);
      expect(code).not.toBeNull();
      seen.add(code!);
    }
    for (const code of seen) {
      const name = sourceLanguageEndonym(code);
      // languageEndonym passes an unknown code straight through, so a bare code
      // coming back means the identifier can name something nothing can label.
      expect(name).not.toBe(code);
    }
  });

  it('names Portuguese without picking a country for it', () => {
    // The target list splits Portuguese by region because a translation has to
    // go somewhere; a source does not.
    expect(sourceLanguageEndonym('pt')).toBe('Português');
    expect(TARGET_LANGUAGES.some((l) => l.code === 'pt')).toBe(false);
  });
});
