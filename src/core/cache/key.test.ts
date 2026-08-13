import { describe, it, expect } from 'vitest';
import { computeCacheKey } from './key';

describe('computeCacheKey', () => {
  it('produces stable key for identical inputs', async () => {
    const a = await computeCacheKey({ text: 'hello', model: 'gpt-4o', mode: 'selection', targetLang: 'zh-CN' });
    const b = await computeCacheKey({ text: 'hello', model: 'gpt-4o', mode: 'selection', targetLang: 'zh-CN' });
    expect(a).toBe(b);
  });

  it('differs when text changes', async () => {
    const a = await computeCacheKey({ text: 'a', model: 'm', mode: 'selection', targetLang: 'zh-CN' });
    const b = await computeCacheKey({ text: 'b', model: 'm', mode: 'selection', targetLang: 'zh-CN' });
    expect(a).not.toBe(b);
  });

  it('differs when model changes', async () => {
    const a = await computeCacheKey({ text: 't', model: 'm1', mode: 'selection', targetLang: 'zh-CN' });
    const b = await computeCacheKey({ text: 't', model: 'm2', mode: 'selection', targetLang: 'zh-CN' });
    expect(a).not.toBe(b);
  });

  it('differs when mode changes (selection vs fullpage never share entries)', async () => {
    const a = await computeCacheKey({ text: 'cat', model: 'm', mode: 'selection', targetLang: 'zh-CN' });
    const b = await computeCacheKey({ text: 'cat', model: 'm', mode: 'fullpage', targetLang: 'zh-CN' });
    expect(a).not.toBe(b);
  });

  it('differs when target language changes', async () => {
    const a = await computeCacheKey({ text: 't', model: 'm', mode: 'selection', targetLang: 'zh-CN' });
    const b = await computeCacheKey({ text: 't', model: 'm', mode: 'selection', targetLang: 'en' });
    expect(a).not.toBe(b);
  });

  it('produces hex-only output', async () => {
    const k = await computeCacheKey({ text: 't', model: 'm', mode: 'fullpage', targetLang: 'en' });
    expect(k).toMatch(/^[0-9a-f]+$/);
  });
});
