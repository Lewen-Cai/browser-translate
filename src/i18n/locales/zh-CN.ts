import type { StringKey } from './en';

export const zhCN: Record<StringKey, string> = {
  // Common
  loading: '加载中…',
  delete: '删除',
  clearAll: '清空全部',
  // Popup / options shared
  settings: '设置',
  openFullSettings: '打开完整设置',
  privacyTagline: '开源 · 自带 Key · 零中转 · 零遥测',
  ready: '已就绪',
  notConfigured: '尚未配置',
  // Sections
  sectionApi: 'API',
  sectionTranslation: '翻译',
  sectionRecent: '最近翻译',
  sectionApiEndpoint: '接口地址',
  sectionCache: '缓存',
  sectionAppearance: '外观',
  sectionData: '数据',
  openaiCompatible: '兼容 OpenAI 协议',
  // Options nav
  navApi: 'API',
  navGeneral: '通用',
  // Provider type + presets
  providerType: '服务类型',
  providerTypeCloud: '云服务',
  providerTypeLocal: '本地',
  cloudProvider: '供应商',
  cloudProviderCustom: '自定义',
  cloudEndpoint: '节点',
  applyConfig: '应用配置',
  // Status states
  statusChecking: '检测中…',
  statusModelMissing: '模型未找到',
  statusOffline: '离线',
  // API form
  baseUrl: 'Base URL',
  apiKey: 'API Key',
  model: '模型',
  // Translation form
  targetLanguage: '目标语言',
  triggerMode: '触发方式',
  hotkey: '快捷键',
  hotkeyHint: '仅在触发模式为「快捷键」时生效。',
  keyboardShortcuts: '键盘快捷键',
  pressShortcut: '按下快捷键…',
  iconAfterSelection: '选中文本后显示图标（默认）',
  hotkeyOnly: '仅快捷键触发 — 不显示图标',
  // Full-page translation
  translatePage: '翻译此页',
  showOriginal: '显示原文',
  translateFailed: '翻译失败',
  retry: '重试',
  noTranslationNeeded: '已是目标语言，无需翻译',
  fullPageHotkey: '整页翻译热键',
  // Behavior
  cacheTranslations: '缓存译文',
  cacheDesc: '相同文本直接复用缓存，省 token',
  cacheTtl: '缓存有效期（天）',
  cacheShort: '缓存',
  // Appearance
  theme: '主题',
  themeAuto: '跟随系统',
  themeLight: '浅色',
  themeDark: '深色',
  uiLanguage: '界面语言',
  uiLangAuto: '跟随系统',
  exportSettings: '导出设置',
  importSettings: '导入设置',
  dataSectionDesc: '将配置备份或迁移为 JSON 文件。不含缓存。',
  includeApiKeys: '包含 API 密钥',
  includeApiKeysWarning: '导出文件将以明文包含你的 API 密钥，请妥善保管。',
  importSuccess: '设置已导入。',
  importFailed: '导入失败',
  // Translation card (Shadow DOM)
  cardExample: '例句',
  cardRefreshNeeded: '扩展已更新，请刷新此页面以继续。',
  // Errors
  noProfileError: '尚未配置 API，请到设置中填入 Key。',
  // YouTube subtitles
  ytSubsButtonTitle: '翻译字幕',
  ytSubsButtonTitleOn: '关闭字幕翻译',
  ytSubsNoCaptions: '该视频没有字幕',
  ytSubsEnableCc: '请先打开字幕（CC）',
  ytSubsNoTranslationNeeded: '字幕已是目标语言',
  ytSubsLive: '不支持直播',
  ytSubsFailed: '字幕翻译失败',
  ytSubsTranslating: '翻译中…',
  ytSubsAutoOnly: '不支持自动生成的字幕',
};
