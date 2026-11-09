import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDefaultAppData } from './defaults';
import type { AppData } from './schema';

/** chrome.storage.local backed by a plain object, shared by every "page". */
function stubStorage(initial: AppData) {
  const data: Record<string, unknown> = { 'app:data': initial };
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        async get(key: string) { return key in data ? { [key]: data[key] } : {}; },
        async set(items: Record<string, unknown>) { Object.assign(data, items); },
      },
    },
  });
  return () => data['app:data'] as AppData;
}

/** A fresh module instance stands for one open page: the popup or the settings page. */
async function openPage() {
  vi.resetModules();
  const { useAppStore } = await import('./store');
  await useAppStore.getState().load();
  return useAppStore;
}

function seeded(): AppData {
  const data = createDefaultAppData();
  data.providers.deepseek = { ...data.providers.deepseek, apiKey: 'k', model: 'deepseek-chat', models: ['deepseek-chat'], enabled: true };
  data.providers.microsoft.enabled = true;
  const route = { provider: 'deepseek' as const, model: 'deepseek-chat' };
  data.settings.engines = { selection: route, fullPage: route, subtitle: route };
  return data;
}

describe('app store writes', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('does not write one page’s stale routing over a choice made on another', async () => {
    const stored = stubStorage(seeded());
    const settingsPage = await openPage();
    const popup = await openPage();

    await settingsPage.getState().updateProvider('deepseek', { enabled: false });
    await popup.getState().updateSettings({ engines: { ...stored().settings.engines, selection: { provider: 'microsoft' } } });
    // The settings page still holds its own copy; switching DeepSeek back on
    // from there must not restore what that copy says.
    await settingsPage.getState().updateProvider('deepseek', { enabled: true });

    expect(stored().settings.engines.selection).toEqual({ provider: 'microsoft' });
    expect(stored().providers.deepseek.enabled).toBe(true);
  });

  it('forgets the modes of a provider that is switched off, for good', async () => {
    const stored = stubStorage(seeded());
    const page = await openPage();

    await page.getState().updateProvider('deepseek', { enabled: false });
    expect(stored().settings.engines).toEqual({ selection: null, fullPage: null, subtitle: null });

    await page.getState().updateProvider('deepseek', { enabled: true });
    expect(stored().settings.engines).toEqual({ selection: null, fullPage: null, subtitle: null });
  });

  it('forgets the modes using a model that is removed, and only those', async () => {
    const data = seeded();
    data.providers.deepseek.models = ['deepseek-chat', 'deepseek-reasoner'];
    data.settings.engines.fullPage = { provider: 'deepseek', model: 'deepseek-reasoner' };
    data.settings.engines.subtitle = { provider: 'microsoft' };
    const stored = stubStorage(data);
    const page = await openPage();

    await page.getState().updateProvider('deepseek', { model: 'deepseek-reasoner', models: ['deepseek-reasoner'] });
    expect(stored().settings.engines).toEqual({
      selection: null,
      fullPage: { provider: 'deepseek', model: 'deepseek-reasoner' },
      subtitle: { provider: 'microsoft' },
    });
  });

  it('runs quick successive edits one after another', async () => {
    const stored = stubStorage(seeded());
    const page = await openPage();
    await Promise.all([
      page.getState().updateSettings({ targetLanguage: 'ja' }),
      page.getState().updateProvider('openai', { apiKey: 'x' }),
    ]);
    expect(stored().settings.targetLanguage).toBe('ja');
    expect(stored().providers.openai.apiKey).toBe('x');
  });
});
