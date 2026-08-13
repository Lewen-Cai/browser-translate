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
      targetLanguage: 'zh-CN',
      triggerMode: 'icon',
      hotkey: 'Alt+T',
      fullPageHotkey: 'Alt+A',
      cacheEnabled: true,
      cacheTTLDays: 7,
      theme: 'auto',
      uiLanguage: 'auto',
    },
  };
}
