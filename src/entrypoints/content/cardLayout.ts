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

export interface CardBasePosition {
  /** Document-space left/top the card opens at. */
  left: number;
  top: number;
  maxHeight: number;
}

/**
 * Where a card for this selection opens, in document space.
 *
 * Worth computing once and holding on to: it reads the current scroll, and the
 * viewport clamp inside `computeCardVerticalLayout` means the answer moves as
 * the page scrolls. Recomputing it per render would drift the card whenever
 * anything else caused a render mid-scroll.
 */
export function computeCardBasePosition(rect: DOMRect, width: number): CardBasePosition {
  const iconPos = computeIconPosition(rect);
  let left = iconPos.left + ICON_SIZE - width;
  const minLeft = window.scrollX + MARGIN / 2;
  const maxLeft = window.scrollX + window.innerWidth - width - MARGIN / 2;
  if (left < minLeft) left = minLeft;
  if (left > maxLeft) left = maxLeft;
  const { top, maxHeight } = computeCardVerticalLayout(rect);
  return { left, top, maxHeight };
}

/**
 * Constrain a dragged card to the viewport. Positions are document-space by
 * default, and the clamps collapse to the minimum when the viewport is narrower
 * than the card, so a small window pins it to the left edge rather than
 * off-screen.
 *
 * `origin` is where the coordinate space starts relative to the document. A
 * pinned card is positioned against the viewport instead, so it passes the
 * origin as zero and gets the same box measured from the screen's corner.
 */
export function clampCardPosition(
  left: number,
  top: number,
  width: number,
  origin: { x: number; y: number } = { x: window.scrollX, y: window.scrollY },
): { left: number; top: number } {
  const { innerWidth, innerHeight } = window;
  const { x: scrollX, y: scrollY } = origin;
  const minLeft = scrollX + MARGIN / 2;
  const maxLeft = scrollX + innerWidth - width - MARGIN / 2;
  const minTop = scrollY + MARGIN / 2;
  const maxTop = scrollY + innerHeight - KEEP_VISIBLE;
  return {
    left: Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft)),
    top: Math.min(Math.max(top, minTop), Math.max(minTop, maxTop)),
  };
}
