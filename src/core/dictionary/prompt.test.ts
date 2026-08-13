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
    const sys = autoSystemPrompt();
    expect(sys).toContain('headword');
    expect(sys).toContain(DEFAULT_STYLE_PROMPT);
    expect(sys).toContain('TRANSLATION MODE');
    expect(sys).toContain('DICTIONARY MODE');
  });
});
