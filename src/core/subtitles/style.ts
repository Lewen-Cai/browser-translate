/**
 * How the on-video subtitles look and where they sit.
 *
 * Everything here is pure data with normalizers that repair whatever comes back
 * from storage. The normalizers return the value they were given when it is
 * already clean — the storage layer decides whether to write back by reference
 * identity, so allocating a fresh object for unchanged data would put it in a
 * load-write-reload loop.
 */

export const SUBTITLE_DISPLAY_MODES = ['bilingual', 'originalOnly', 'translationOnly'] as const;
export type SubtitleDisplayMode = (typeof SUBTITLE_DISPLAY_MODES)[number];

export const SUBTITLE_TRANSLATION_POSITIONS = ['above', 'below'] as const;
export type SubtitleTranslationPosition = (typeof SUBTITLE_TRANSLATION_POSITIONS)[number];

/**
 * Font choices are stacks of font names. Nothing is bundled and nothing is
 * fetched — naming a family asks for whatever is already there, which is why
 * this costs nothing and carries no licence: the OS-shipped CJK faces and
 * YouTube's own webfont are referenced, never copied.
 *
 * `youtube` is YouTube's caption stack verbatim, so our lines match the
 * player's. Its "YouTube Noto" is a webfont YouTube itself serves, and a
 * @font-face declared by the page does reach into a shadow root — so the name
 * resolves for us on a watch page and falls through to Roboto anywhere it
 * doesn't. The CJK faces are appended because the stack has none of its own and
 * fallback is per character.
 */
export const SUBTITLE_FONT_FAMILIES = {
  youtube: '"YouTube Noto", Roboto, "Arial Unicode Ms", Arial, Helvetica, Verdana,'
    + ' "PT Sans Caption", "PingFang SC", "Microsoft YaHei", sans-serif',
  sans: '"Noto Sans", "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", sans-serif',
  serif: '"Noto Serif", Georgia, "Songti SC", SimSun, "Hiragino Mincho ProN", serif',
  kai: '"LXGW WenKai", KaiTi, 楷体, STKaiti, 华文楷体, serif',
} as const;

export type SubtitleFontFamily = keyof typeof SUBTITLE_FONT_FAMILIES;

export const SUBTITLE_FONT_FAMILY_IDS = Object.keys(SUBTITLE_FONT_FAMILIES) as SubtitleFontFamily[];

export interface SubtitleTextStyle {
  /** Percentage of the size derived from the player's height, 50–200. */
  fontScale: number;
  /** `#rrggbb`. */
  color: string;
  fontFamily: SubtitleFontFamily;
  /** 300–700 in steps of 100. */
  fontWeight: number;
}

export interface SubtitleStyle {
  displayMode: SubtitleDisplayMode;
  /** Where the translation sits relative to the original, in bilingual mode. */
  translationPosition: SubtitleTranslationPosition;
  /** Opacity of the plate behind the text, 0–100. */
  backgroundOpacity: number;
  main: SubtitleTextStyle;
  translation: SubtitleTextStyle;
}

/**
 * Where the block sits, as a percentage of the player's height away from one of
 * its edges. A percentage rather than pixels so the spot the viewer chose still
 * means the same thing in theater mode and fullscreen; an edge rather than a
 * single top-down number so dragging past the middle of the picture pins the
 * block to the top and it stays there when the player grows.
 */
export interface SubtitlePosition {
  percent: number;
  anchor: 'top' | 'bottom';
}

export const MIN_SUBTITLE_FONT_SCALE = 50;
export const MAX_SUBTITLE_FONT_SCALE = 200;
export const DEFAULT_SUBTITLE_FONT_SCALE = 100;

export const MIN_SUBTITLE_FONT_WEIGHT = 300;
export const MAX_SUBTITLE_FONT_WEIGHT = 700;
export const DEFAULT_SUBTITLE_FONT_WEIGHT = 400;

export const DEFAULT_SUBTITLE_BACKGROUND_OPACITY = 78;
export const DEFAULT_SUBTITLE_COLOR = '#FFFFFF';

/** Far enough up to clear the control bar without floating into the picture. */
export const DEFAULT_SUBTITLE_POSITION: SubtitlePosition = { percent: 6, anchor: 'bottom' };
/** Leave the far edge reachable but never let the block leave the player. */
export const MAX_SUBTITLE_POSITION_PCT = 92;

export const DEFAULT_SUBTITLE_TEXT_STYLE: SubtitleTextStyle = {
  fontScale: DEFAULT_SUBTITLE_FONT_SCALE,
  color: DEFAULT_SUBTITLE_COLOR,
  fontFamily: 'youtube',
  fontWeight: DEFAULT_SUBTITLE_FONT_WEIGHT,
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  displayMode: 'bilingual',
  translationPosition: 'below',
  backgroundOpacity: DEFAULT_SUBTITLE_BACKGROUND_OPACITY,
  main: DEFAULT_SUBTITLE_TEXT_STYLE,
  translation: DEFAULT_SUBTITLE_TEXT_STYLE,
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampSubtitleFontScale(value: unknown): number {
  return clampNumber(
    value, MIN_SUBTITLE_FONT_SCALE, MAX_SUBTITLE_FONT_SCALE, DEFAULT_SUBTITLE_FONT_SCALE,
  );
}

export function clampSubtitleFontWeight(value: unknown): number {
  const clamped = clampNumber(
    value, MIN_SUBTITLE_FONT_WEIGHT, MAX_SUBTITLE_FONT_WEIGHT, DEFAULT_SUBTITLE_FONT_WEIGHT,
  );
  return Math.round(clamped / 100) * 100;
}

export function clampSubtitleBackgroundOpacity(value: unknown): number {
  return clampNumber(value, 0, 100, DEFAULT_SUBTITLE_BACKGROUND_OPACITY);
}

export function normalizeSubtitleColor(value: unknown): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : DEFAULT_SUBTITLE_COLOR;
}

export function normalizeSubtitleTextStyle(value: unknown): SubtitleTextStyle {
  const raw = isRecord(value) ? value : {};
  const fontScale = clampSubtitleFontScale(raw.fontScale);
  const color = normalizeSubtitleColor(raw.color);
  const fontFamily = SUBTITLE_FONT_FAMILY_IDS.includes(raw.fontFamily as SubtitleFontFamily)
    ? (raw.fontFamily as SubtitleFontFamily)
    : 'youtube';
  const fontWeight = clampSubtitleFontWeight(raw.fontWeight);

  if (
    raw.fontScale === fontScale && raw.color === color
    && raw.fontFamily === fontFamily && raw.fontWeight === fontWeight
  ) {
    return raw as unknown as SubtitleTextStyle;
  }
  return { fontScale, color, fontFamily, fontWeight };
}

export function normalizeSubtitleStyle(value: unknown): SubtitleStyle {
  const raw = isRecord(value) ? value : {};
  const displayMode = SUBTITLE_DISPLAY_MODES.includes(raw.displayMode as SubtitleDisplayMode)
    ? (raw.displayMode as SubtitleDisplayMode)
    : DEFAULT_SUBTITLE_STYLE.displayMode;
  const translationPosition = SUBTITLE_TRANSLATION_POSITIONS.includes(
    raw.translationPosition as SubtitleTranslationPosition,
  )
    ? (raw.translationPosition as SubtitleTranslationPosition)
    : DEFAULT_SUBTITLE_STYLE.translationPosition;
  const backgroundOpacity = clampSubtitleBackgroundOpacity(raw.backgroundOpacity);
  const main = normalizeSubtitleTextStyle(raw.main);
  const translation = normalizeSubtitleTextStyle(raw.translation);

  if (
    raw.displayMode === displayMode && raw.translationPosition === translationPosition
    && raw.backgroundOpacity === backgroundOpacity
    && raw.main === main && raw.translation === translation
  ) {
    return raw as unknown as SubtitleStyle;
  }
  return { displayMode, translationPosition, backgroundOpacity, main, translation };
}

export function normalizeSubtitlePosition(value: unknown): SubtitlePosition {
  const raw = isRecord(value) ? value : {};
  const anchor = raw.anchor === 'top' ? 'top' : 'bottom';
  const percent = typeof raw.percent === 'number' && Number.isFinite(raw.percent)
    ? Math.min(MAX_SUBTITLE_POSITION_PCT, Math.max(0, raw.percent))
    : DEFAULT_SUBTITLE_POSITION.percent;

  if (raw.anchor === anchor && raw.percent === percent) {
    return raw as unknown as SubtitlePosition;
  }
  return { percent, anchor };
}

/** True when the original line should be drawn at all. */
export function showsOriginal(mode: SubtitleDisplayMode): boolean {
  return mode !== 'translationOnly';
}

/** True when the translation line should be drawn at all. */
export function showsTranslation(mode: SubtitleDisplayMode): boolean {
  return mode !== 'originalOnly';
}
