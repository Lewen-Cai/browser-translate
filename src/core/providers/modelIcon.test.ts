import { describe, it, expect } from 'vitest';
import { isMonoModelIcon, modelIconName, modelMarkFor } from './modelIcon';
import { MODEL_ICON_RULES } from './modelIcons.generated';
import { existsSync } from 'node:fs';

describe('modelIconName', () => {
  it.each([
    // OpenRouter-style namespaced ids
    ['anthropic/claude-sonnet-4.5', 'claude'],
    ['openai/gpt-4o-mini', 'openai'],
    ['google/gemini-2.5-flash', 'gemini'],
    ['google/gemma-3-27b-it', 'gemma'],
    ['deepseek/deepseek-chat-v3.1', 'deepseek'],
    ['~deepseek/deepseek-flash-latest', 'deepseek'],
    ['moonshotai/kimi-k2', 'moonshot'],
    ['z-ai/glm-4.6', 'zai'],
    ['qwen/qwen3-235b-a22b', 'qwen'],
    ['mistralai/mistral-small-3.2', 'mistral'],
    ['meta-llama/llama-3.3-70b-instruct', 'meta'],
    ['x-ai/grok-4', 'grok'],
    ['minimax/minimax-m2', 'minimax'],
    ['xiaomi/mimo-v2-flash', 'xiaomimimo'],
    ['liquid/lfm-2.2-6b', 'liquid'],
    ['meituan/longcat-flash-chat', 'longcat'],
    ['perplexity/sonar-pro', 'perplexity'],
    ['nvidia/llama-3.1-nemotron-70b', 'nvidia'],
    // SiliconFlow
    ['Pro/deepseek-ai/DeepSeek-V3', 'deepseek'],
    ['Qwen/Qwen2.5-72B-Instruct', 'qwen'],
    // Bare ids, local runtimes
    ['gpt-4o', 'openai'],
    ['o3-mini', 'openai'],
    ['claude-opus-4-1', 'claude'],
    ['qwen2.5:7b', 'qwen'],
    ['llama3.1:8b', 'meta'],
    ['kimi-k2-turbo-preview', 'moonshot'],
    ['doubao-seed-1-6', 'doubao'],
    ['hunyuan-turbos-latest', 'hunyuan'],
    ['ernie-4.5-turbo', 'wenxin'],
  ])('%s → %s', (id, icon) => {
    expect(modelIconName(id)).toBe(icon);
  });

  it('returns null when nothing in the id names a vendor', () => {
    expect(modelIconName('my-finetune-v2')).toBeNull();
    expect(modelIconName('  ')).toBeNull();
  });

  it('knows which icons are single-colour', () => {
    expect(isMonoModelIcon('openai')).toBe(true);
    expect(isMonoModelIcon('claude')).toBe(false);
  });

  it('has a file for every icon the table names', () => {
    for (const [icon] of MODEL_ICON_RULES) {
      expect(existsSync(`public/model-icons/${icon}.svg`), icon).toBe(true);
    }
  });
});

describe('modelMarkFor', () => {
  it("skips a mark that would only repeat the provider's own", () => {
    expect(modelMarkFor('deepseek', 'deepseek-chat')).toBeUndefined();
    expect(modelMarkFor('anthropic', 'claude-opus-4-1')).toBeUndefined();
    expect(modelMarkFor('dashscope', 'qwen-max')).toBeUndefined();
  });

  it('draws the vendor under a gateway or a runtime', () => {
    expect(modelMarkFor('openrouter', 'deepseek/deepseek-chat')).toBe('deepseek');
    expect(modelMarkFor('local', 'qwen2.5:7b')).toBe('qwen');
  });
});
