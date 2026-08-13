import { describe, it, expect } from 'vitest';
import { DEFAULT_STYLE_PROMPT, selectionUserPrompt } from './style';

describe('DEFAULT_STYLE_PROMPT', () => {
  it('is the professional-translator style instruction', () => {
    expect(DEFAULT_STYLE_PROMPT).toContain('professional translator');
    expect(DEFAULT_STYLE_PROMPT).toContain('Output ONLY the translation');
  });
});

describe('selectionUserPrompt', () => {
  it('embeds the text and target language', () => {
    const msg = selectionUserPrompt('Bonjour le monde', 'en');
    expect(msg).toContain('Bonjour le monde');
    expect(msg).toContain('en');
  });

  it('preserves literal {{...}} sequences in the selected text verbatim', () => {
    const msg = selectionUserPrompt('Use {{name}} as a placeholder', 'zh-CN');
    expect(msg).toContain('Use {{name}} as a placeholder');
  });
});
