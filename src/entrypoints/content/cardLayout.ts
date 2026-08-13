import { computeIconPosition, ICON_SIZE } from './TriggerIcon';

export interface CardVerticalLayout {
  /** Document-space top for the card (the shadow host is position:absolute). */
  top: number;
  /** Max height in px so the card never exceeds the viewport; the body scrolls. */
  maxHeight: number;
}

const MARGIN = 8;
const ICON_GAP = 2;
const MIN_HEIGHT = 120;

/**
 * Vertical placement for the TranslationCard. The card drops just below the
 * trigger icon, but is always kept fully inside the viewport: it is pulled up
 * when the selection sits near the bottom, and a max-height is returned so a
 * long translation scrolls INSIDE the card instead of overflowing off-screen.
 *
 * Reads window.innerHeight / scrollY (same convention as computeIconPosition);
 * the returned `top` is document-space.
 */
export function computeCardVerticalLayout(rect: DOMRect): CardVerticalLayout {
  const { innerHeight, scrollY } = window;
  const iconPos = computeIconPosition(rect);
  const iconBottomVp = iconPos.top + ICON_SIZE - scrollY; // viewport space

  let topVp = iconBottomVp + ICON_GAP;

  // Keep at least MIN_HEIGHT of room above the viewport bottom; if the selection
  // is near the bottom, pull the card up so it stays readable.
  const maxTopVp = innerHeight - MIN_HEIGHT - MARGIN;
  if (topVp > maxTopVp) topVp = maxTopVp;
  if (topVp < MARGIN) topVp = MARGIN;

  const maxHeight = innerHeight - topVp - MARGIN;
  return { top: topVp + scrollY, maxHeight };
}

/** Enough of a dragged card must stay on screen to grab it again. */
const KEEP_VISIBLE = 48;

/**
 * Constrain a dragged card to the viewport. Positions are document-space, and
 * the clamps collapse to the minimum when the viewport is narrower than the
 * card, so a small window pins it to the left edge rather than off-screen.
 */
export function clampCardPosition(
  left: number,
  top: number,
  width: number,
): { left: number; top: number } {
  const { innerWidth, innerHeight, scrollX, scrollY } = window;
  const minLeft = scrollX + MARGIN / 2;
  const maxLeft = scrollX + innerWidth - width - MARGIN / 2;
  const minTop = scrollY + MARGIN / 2;
  const maxTop = scrollY + innerHeight - KEEP_VISIBLE;
  return {
    left: Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft)),
    top: Math.min(Math.max(top, minTop), Math.max(minTop, maxTop)),
  };
}
