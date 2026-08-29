/**
 * How big the selection card is.
 *
 * A setting rather than a constant because there is no size that is right for
 * everyone: the card is fixed so that an answer arriving never moves anything,
 * and the cost of that is somebody having to decide how much room the answer
 * gets. On a laptop beside a column of text a small card stays out of the way;
 * on a wide screen reading long paragraphs, a bigger one saves scrolling. That
 * is a judgement about how someone reads, so it is theirs.
 *
 * The bounds are the range in which the card still works. Below them the header
 * controls and the two panes stop fitting; above them the card stops being a
 * card and becomes a window over the page.
 */

export interface CardSize {
  width: number;
  height: number;
}

export const MIN_CARD_WIDTH = 320;
export const MAX_CARD_WIDTH = 640;
export const MIN_CARD_HEIGHT = 200;
export const MAX_CARD_HEIGHT = 560;

export const DEFAULT_CARD_SIZE: CardSize = { width: 420, height: 300 };

/** Offered as steps rather than a free number: this is a preference, not a measurement. */
export const CARD_WIDTH_CHOICES = [320, 360, 420, 480, 560, 640] as const;
export const CARD_HEIGHT_CHOICES = [200, 240, 300, 360, 440, 560] as const;

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.round(Math.min(max, Math.max(min, value)));
}

/**
 * Repair a stored size. Returns the SAME object when it is already sound —
 * `fillSettingsDefaults` decides whether a store needs writing back by identity,
 * and a fresh object every load would mean a write every load.
 */
export function normalizeCardSize(value: unknown): CardSize {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<CardSize>;
  const width = clamp(raw.width, MIN_CARD_WIDTH, MAX_CARD_WIDTH, DEFAULT_CARD_SIZE.width);
  const height = clamp(raw.height, MIN_CARD_HEIGHT, MAX_CARD_HEIGHT, DEFAULT_CARD_SIZE.height);
  if (raw.width === width && raw.height === height) return raw as CardSize;
  return { width, height };
}
