import { APP_DATA_VERSION, type AppData, type ProviderConfig, type ProvidersConfig } from './schema';
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from '~/core/providers/registry';
import { DEFAULT_PROVIDER } from '~/core/engines/routing';
import { DEFAULT_SUBTITLE_POSITION, DEFAULT_SUBTITLE_STYLE } from '~/core/subtitles/style';
import { DEFAULT_TARGET_LANGUAGE } from '~/core/language/targets';

/**
 * A blank row for `id`. Cloud vendors start on their first endpoint so the
 * field is filled in before the user opens it; the free services and the
 * hand-entered ones have nothing to pre-fill.
 *
 * Only the free services are on by default: they need no key, so a fresh
 * install translates immediately, while every model waits to be configured.
 */
export function defaultProviderConfig(id: ProviderId): ProviderConfig {
  const def = PROVIDERS[id];
  return {
    baseUrl: def.endpoints[0]?.baseUrl ?? '',
    apiKey: '',
    model: '',
    enabled: def.kind === 'service',
  };
}

export function createDefaultProviders(): ProvidersConfig {
  const out = {} as ProvidersConfig;
  for (const id of PROVIDER_IDS) out[id] = defaultProviderConfig(id);
  return out;
}

export function createDefaultAppData(): AppData {
  return {
    version: APP_DATA_VERSION,
    providers: createDefaultProviders(),
    settings: {
      engines: {
        selection: DEFAULT_PROVIDER,
        fullPage: DEFAULT_PROVIDER,
        subtitle: DEFAULT_PROVIDER,
      },
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
