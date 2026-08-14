import type { MtEngineId } from './types';

/**
 * The app stores BCP-47-ish codes ('zh-CN', 'en', …). Anything not listed here
 * falls back to the primary subtag, which both services accept. Two families
 * need naming explicitly:
 *
 * - Chinese: Microsoft's Translator uses script subtags (zh-Hans/zh-Hant) while
 *   Google's endpoint uses the region form (zh-CN/zh-TW).
 * - European Portuguese: both engines honour `pt-PT` and translate it
 *   differently from plain `pt`, which both read as Brazilian. Dropping the
 *   region here would answer in the wrong variety without erroring.
 */
const OVERRIDES: Record<MtEngineId, Record<string, string>> = {
  microsoft: { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant', 'pt-PT': 'pt-PT' },
  google: { 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'pt-PT': 'pt-PT' },
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
