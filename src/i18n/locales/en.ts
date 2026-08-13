// English — source of truth for the i18n key set.
// StringKey is derived from this object; every other locale must implement Record<StringKey, string>.
export const en = {
  // Common
  loading: 'Loading…',
  delete: 'Delete',
  clearAll: 'Clear all',
  // Popup / options shared
  settings: 'Settings',
  openFullSettings: 'Open full settings',
  privacyTagline: 'Open-source · BYOK · Zero relay · Zero telemetry',
  ready: 'Ready',
  notConfigured: 'Not configured',
  // Sections
  sectionApi: 'API',
  sectionTranslation: 'Translation',
  sectionRecent: 'Recent',
  sectionApiEndpoint: 'API Endpoint',
  sectionCache: 'Cache',
  sectionAppearance: 'Appearance',
  sectionData: 'Data',
  openaiCompatible: 'OpenAI-compatible',
  // Options nav
  navApi: 'API',
  navGeneral: 'GENERAL',
  // Provider type + presets
  providerType: 'Provider type',
  providerTypeCloud: 'Cloud',
  providerTypeLocal: 'Local',
  cloudProvider: 'Provider',
  cloudProviderCustom: 'Custom',
  cloudEndpoint: 'Endpoint',
  applyConfig: 'Apply config',
  // Status states
  statusChecking: 'Checking…',
  statusModelMissing: 'Model not found',
  statusOffline: 'Offline',
  // API form
  baseUrl: 'Base URL',
  apiKey: 'API Key',
  model: 'Model',
  // Translation form
  targetLanguage: 'Target language',
  triggerMode: 'Trigger mode',
  hotkey: 'Hotkey',
  hotkeyHint: 'Only active when Trigger mode is set to Hotkey.',
  keyboardShortcuts: 'Keyboard shortcuts',
  pressShortcut: 'Press shortcut…',
  iconAfterSelection: 'Icon after selection (default)',
  hotkeyOnly: 'Hotkey only — no icon',
  // Full-page translation
  translatePage: 'Translate page',
  showOriginal: 'Show original',
  translateFailed: 'Translation failed',
  retry: 'Retry',
  noTranslationNeeded: 'Already in your target language',
  fullPageHotkey: 'Full-page hotkey',
  // Behavior
  cacheTranslations: 'Cache translations',
  cacheDesc: 'Reuse exact-match translations to save tokens',
  cacheTtl: 'Cache TTL (days)',
  cacheShort: 'Cache',
  // Appearance
  theme: 'Theme',
  themeAuto: 'Follow system',
  themeLight: 'Light',
  themeDark: 'Dark',
  uiLanguage: 'Interface language',
  uiLangAuto: 'Follow system',
  exportSettings: 'Export settings',
  importSettings: 'Import settings',
  dataSectionDesc: 'Back up or transfer your configuration as a JSON file. The cache is not included.',
  includeApiKeys: 'Include API keys',
  includeApiKeysWarning: 'The exported file will contain your API keys in plaintext. Keep it private.',
  importSuccess: 'Settings imported.',
  importFailed: 'Import failed',
  // Translation card (Shadow DOM)
  cardExample: 'EXAMPLE',
  cardRefreshNeeded: 'Extension was updated. Please refresh this page to continue.',
  // Errors
  noProfileError: 'API not configured. Open settings to add your key.',
  // YouTube subtitles
  ytSubsButtonTitle: 'Translate subtitles',
  ytSubsButtonTitleOn: 'Turn off subtitle translation',
  ytSubsNoCaptions: 'This video has no captions',
  ytSubsEnableCc: 'Turn on captions (CC) first',
  ytSubsNoTranslationNeeded: 'Captions already in target language',
  ytSubsLive: 'Live streams are not supported',
  ytSubsFailed: 'Subtitle translation failed',
  ytSubsTranslating: 'Translating…',
  ytSubsAutoOnly: 'Auto-generated captions are not supported',
} as const;

export type StringKey = keyof typeof en;
