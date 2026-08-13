/**
 * Where the on-video subtitle block sits, as a fraction of the player's height
 * above its bottom edge. A fraction rather than pixels so the position the
 * viewer chose still means the same thing in theater mode and fullscreen.
 */
export const DEFAULT_SUBTITLE_OFFSET_PCT = 0.11; // just above the control bar
const MIN_OFFSET_PCT = 0.02;
const MAX_OFFSET_PCT = 0.8;

/** Keep a stored or dragged offset inside the player. */
export function clampSubtitleOffset(pct: number): number {
  if (!Number.isFinite(pct)) return DEFAULT_SUBTITLE_OFFSET_PCT;
  return Math.min(MAX_OFFSET_PCT, Math.max(MIN_OFFSET_PCT, pct));
}

/**
 * Text size as a percentage of the size derived from the player's height. The
 * automatic size already tracks the player, so this only expresses a personal
 * preference on top of it.
 */
export const DEFAULT_SUBTITLE_FONT_SCALE = 100;
export const MIN_SUBTITLE_FONT_SCALE = 50;
export const MAX_SUBTITLE_FONT_SCALE = 200;

/** Opacity of the plate behind the text, as a percentage. */
export const DEFAULT_SUBTITLE_BACKGROUND_OPACITY = 78;

export function clampSubtitleFontScale(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SUBTITLE_FONT_SCALE;
  return Math.min(MAX_SUBTITLE_FONT_SCALE, Math.max(MIN_SUBTITLE_FONT_SCALE, Math.round(value)));
}

export function clampSubtitleBackgroundOpacity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SUBTITLE_BACKGROUND_OPACITY;
  return Math.min(100, Math.max(0, Math.round(value)));
}
