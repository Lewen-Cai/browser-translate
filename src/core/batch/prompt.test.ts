import { describe, it, expect } from 'vitest';
import { batchSystemPrompt, batchUserPrompt } from './prompt';
import { DEFAULT_STYLE_PROMPT } from '~/core/prompt/style';

describe('batchSystemPrompt', () => {
  it('embeds the default style prompt and demands a JSON array', () => {
    const sys = batchSystemPrompt();
    expect(sys).toContain(DEFAULT_STYLE_PROMPT);
    expect(sys).toContain('JSON array');
    expect(sys.toLowerCase()).toContain('translation');
  });
});

describe('batchUserPrompt', () => {
  it('numbers each segment and states the target language', () => {
    const user = batchUserPrompt(['Hello', 'World'], 'zh-CN');
    expect(user).toContain('zh-CN');
    expect(user).toContain('Hello');
    expect(user).toContain('World');
    expect(user).toContain('2'); // count or index appears
  });
});
