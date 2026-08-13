import { APP_DATA_VERSION, type AppData } from './schema';

export function createDefaultAppData(): AppData {
  return {
    version: APP_DATA_VERSION,
    api: {
      baseUrl: '',
      apiKey: '',
      model: '',
      providerType: 'cloud',
      cloudProvider: 'custom',
    },
    settings: {
      // A free engine by default so a fresh install translates immediately;
      // choosing an LLM is an opt-in for dictionary lookups and better prose.
      engine: 'microsoft',
      targetLanguage: 'zh-CN',
      triggerMode: 'icon',
      hotkey: 'Alt+T',
      fullPageHotkey: 'Alt+A',
      cacheEnabled: true,
      cacheTTLDays: 7,
      theme: 'auto',
      themeId: 'cobalt',
      customThemes: [],
      uiLanguage: 'auto',
    },
  };
}
