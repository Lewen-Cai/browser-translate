import { APP_DATA_VERSION, type AppData } from './schema';
import { DEFAULT_SUBTITLE_POSITION, DEFAULT_SUBTITLE_STYLE } from '~/core/subtitles/style';
import { DEFAULT_TARGET_LANGUAGE } from '~/core/language/targets';

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
      targetLanguage: DEFAULT_TARGET_LANGUAGE,
      triggerMode: 'icon',
      hotkey: 'Alt+T',
      fullPageHotkey: 'Alt+A',
      cacheEnabled: true,
      cacheTTLDays: 7,
      subtitlePosition: DEFAULT_SUBTITLE_POSITION,
      subtitleStyle: DEFAULT_SUBTITLE_STYLE,
      theme: 'auto',
      uiLanguage: 'auto',
    },
  };
}
