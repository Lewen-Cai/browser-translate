import type { MtEngineId } from './types';

/**
 * The app stores BCP-47-ish codes ('zh-CN', 'en', …). The two services agree on
 * everything except Chinese: Microsoft's Translator uses script subtags
 * (zh-Hans/zh-Hant) while Google's endpoint uses the region form (zh-CN/zh-TW).
 * Anything not listed falls back to the primary subtag, which both accept.
 */
const OVERRIDES: Record<MtEngineId, Record<string, string>> = {
  microsoft: { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant' },
  google: { 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW' },
};

/** Map an app language code to the engine's own code. */
export function toEngineLang(engine: MtEngineId, appLang: string): string {
  const code = appLang.trim();
  if (!code) return '';
  const override = OVERRIDES[engine][code];
  if (override) return override;
  return code.split('-')[0] ?? code;
}

/**
 * The "detect it yourself" source value. Microsoft's endpoint wants the `from`
 * parameter left empty; Google's body wants the literal string 'auto'.
 */
export function autoSourceLang(engine: MtEngineId): string {
  return engine === 'microsoft' ? '' : 'auto';
}

/** Resolve the source parameter: an explicit language, or the engine's auto value. */
export function toEngineSourceLang(engine: MtEngineId, appLang: string | undefined): string {
  if (!appLang || appLang === 'auto') return autoSourceLang(engine);
  return toEngineLang(engine, appLang);
}
