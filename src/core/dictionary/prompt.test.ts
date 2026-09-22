import { describe, it, expect } from 'vitest';
import { autoSystemPrompt, DICTIONARY_SPEC } from './prompt';
import { DEFAULT_STYLE_PROMPT } from '~/core/prompt/style';

describe('DICTIONARY_SPEC', () => {
  it('carries the JSON contract parseDictionaryEntry expects', () => {
    expect(DICTIONARY_SPEC).toContain('"headword"');
    expect(DICTIONARY_SPEC).toContain('senses');
    expect(DICTIONARY_SPEC).toContain('phonetic');
  });
});

describe('autoSystemPrompt', () => {
  it('embeds the dictionary spec and the default translation style', () => {
    const sys = autoSystemPrompt('zh-CN');
    expect(sys).toContain('headword');
    expect(sys).toContain(DEFAULT_STYLE_PROMPT);
    expect(sys).toContain('TRANSLATION MODE');
    expect(sys).toContain('DICTIONARY MODE');
    expect(sys).toContain('Chinese (Simplified)');
  });

  it('keeps custom instructions separate from target context and internal protocol', () => {
    const sys = autoSystemPrompt('en-AU', 'Use my {{terminology}}.');
    expect(sys).toContain('Australian English');
    expect(sys).toContain('Input may mix languages');
    expect(sys).toContain('Use my {{terminology}}.');
    expect(sys).not.toContain(DEFAULT_STYLE_PROMPT);
    expect(sys.indexOf('OUTPUT PROTOCOL')).toBeGreaterThan(sys.indexOf('Use my'));
  });
});
