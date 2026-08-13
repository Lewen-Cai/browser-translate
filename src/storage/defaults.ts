import { APP_DATA_VERSION, type AppData } from './schema';
import {
  DEFAULT_SUBTITLE_BACKGROUND_OPACITY,
  DEFAULT_SUBTITLE_FONT_SCALE,
  DEFAULT_SUBTITLE_OFFSET_PCT,
} from '~/core/subtitles/layout';

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
      subtitleOffsetPct: DEFAULT_SUBTITLE_OFFSET_PCT,
      subtitleFontScale: DEFAULT_SUBTITLE_FONT_SCALE,
      subtitleBackgroundOpacity: DEFAULT_SUBTITLE_BACKGROUND_OPACITY,
      subtitleTranslationOnly: false,
      theme: 'auto',
      themeId: 'cobalt',
      customThemes: [],
      uiLanguage: 'auto',
    },
  };
}
