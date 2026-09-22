import { describe, it, expect } from 'vitest';
import { batchSystemPrompt, batchUserPrompt } from './prompt';
import { DEFAULT_STYLE_PROMPT } from '~/core/prompt/style';

describe('batchSystemPrompt', () => {
  it('embeds the default style prompt and demands a JSON array', () => {
    const sys = batchSystemPrompt('en-GB');
    expect(sys).toContain(DEFAULT_STYLE_PROMPT);
    expect(sys).toContain('JSON array');
    expect(sys.toLowerCase()).toContain('translation');
  });
});

describe('batchUserPrompt', () => {
  it('JSON-encodes each segment and states the target language', () => {
    const user = batchUserPrompt(['Hello', 'World'], 'zh-CN');
    expect(user).toContain('zh-CN');
    expect(user).toContain('Hello');
    expect(user).toContain('World');
    expect(user).toContain('[{"id":0,"text":"Hello"},{"id":1,"text":"World"}]');
  });

  it('preserves multiline input, quotes, and literal variables without interpreting them', () => {
    const segments = ['a\nb', '"hello" {{targetLang}}'];
    const user = batchUserPrompt(segments, 'en-AU');
    expect(JSON.parse(user.slice(user.indexOf('\n\n') + 2))).toEqual(segments.map((text, id) => ({ id, text })));
  });
});
