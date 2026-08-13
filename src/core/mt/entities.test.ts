import { describe, it, expect } from 'vitest';
import { decodeEntities, escapeText } from './entities';

describe('escapeText', () => {
  it('escapes the three HTML text-node characters', () => {
    expect(escapeText('a < b and c > d')).toBe('a &lt; b and c &gt; d');
  });

  it('escapes the ampersand first so escapes are not double-encoded', () => {
    expect(escapeText('Tom & Jerry <3')).toBe('Tom &amp; Jerry &lt;3');
  });

  it('leaves plain text untouched', () => {
    expect(escapeText('你好，世界')).toBe('你好，世界');
  });
});

describe('decodeEntities', () => {
  it('round-trips escaped text', () => {
    const original = 'a < b & c > d';
    expect(decodeEntities(escapeText(original))).toBe(original);
  });

  it('decodes decimal and hex numeric references', () => {
    expect(decodeEntities('it&#39;s')).toBe("it's");
    expect(decodeEntities('it&#x27;s')).toBe("it's");
  });

  it('decodes astral code points', () => {
    expect(decodeEntities('&#128512;')).toBe('\u{1F600}');
  });

  it('decodes the common punctuation entities', () => {
    expect(decodeEntities('&ldquo;hi&rdquo;&hellip;')).toBe('“hi”…');
    expect(decodeEntities('caf&eacute;')).toBe('caf&eacute;'); // unknown name left intact
  });

  it('leaves lone surrogates and out-of-range references intact', () => {
    expect(decodeEntities('&#xD800;')).toBe('&#xD800;');
    expect(decodeEntities('&#1114112;')).toBe('&#1114112;');
  });

  it('short-circuits text with no ampersand', () => {
    expect(decodeEntities('plain text')).toBe('plain text');
  });
});
