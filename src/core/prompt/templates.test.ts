import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE_PROMPT } from './style';
import { defaultPromptSettings, normalizePromptSettings, resolveBasePrompt, MAX_PROMPT_LENGTH } from './templates';
import { createDefaultAppData } from '~/storage/defaults';
import { migrateAppData } from '~/storage/migrations';
import { exportAppData, importAppData } from '~/storage/transfer';
import { computeCacheKey } from '~/core/cache/key';
import { autoSystemPrompt } from '~/core/dictionary/prompt';
import { batchSystemPrompt } from '~/core/batch/prompt';

const template = { id: 'custom-1', name: 'Technical', body: 'Use precise terms. Keep {{literal}} intact.' };

describe('base prompt templates', () => {
  it('defaults old stores to the builtin without resurrecting removed legacy templates', () => {
    const data = createDefaultAppData();
    delete (data.settings as Partial<typeof data.settings>).prompts;
    Object.assign(data, { promptTemplates: [template] });
    const out = migrateAppData(data);
    expect(out.settings.prompts).toEqual(defaultPromptSettings());
    expect('promptTemplates' in out).toBe(false);
    expect(migrateAppData(out)).toBe(out);
  });

  it('replaces rather than appends to the default base', () => {
    const settings = { activeId: template.id, templates: [template] };
    expect(resolveBasePrompt(settings)).toBe(template.body);
    expect(autoSystemPrompt('en-AU', resolveBasePrompt(settings))).not.toContain(DEFAULT_STYLE_PROMPT);
    expect(normalizePromptSettings(settings)).toBe(settings);
    expect(resolveBasePrompt(defaultPromptSettings())).toBe(DEFAULT_STYLE_PROMPT);
  });

  it('repairs malformed entries, duplicates, missing active ids and builtin overrides', () => {
    const out = normalizePromptSettings({ activeId: 'missing', templates: [
      null, { ...template, body: 123 }, { ...template, id: 'default' },
      { ...template, body: ' '.repeat(10) }, { ...template, body: 'a'.repeat(MAX_PROMPT_LENGTH + 1) },
      template, { ...template, body: 'duplicate' },
    ] });
    expect(out).toEqual({ activeId: 'default', templates: [template] });
    expect(normalizePromptSettings(out)).toBe(out);
  });

  it('round trips the active template and literal prompt text through settings export', () => {
    const data = createDefaultAppData();
    data.settings.prompts = { activeId: template.id, templates: [template] };
    const file = exportAppData(data, { includeKeys: false }, 1);
    expect(importAppData(JSON.parse(JSON.stringify(file))).settings.prompts).toEqual(data.settings.prompts);
  });

  it('isolates effective prompts, surfaces and regions in the cache', async () => {
    const base = { engine: 'local', model: 'm', text: 'hello', mode: 'fullpage' as const, targetLang: 'en-AU' };
    const prompts = [
      batchSystemPrompt('en-AU'),
      batchSystemPrompt('en-AU', template.body),
      batchSystemPrompt('en-AU', template.body, 'subtitle'),
      batchSystemPrompt('en-GB', template.body),
    ];
    const keys = await Promise.all(prompts.map((prompt) => computeCacheKey({ ...base, prompt })));
    expect(new Set(keys).size).toBe(4);
    expect(await computeCacheKey(base)).not.toBe(keys[0]);
  });
});
