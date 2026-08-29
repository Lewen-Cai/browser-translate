import { computeIconPosition, ICON_SIZE } from './TriggerIcon';
import type { CardSize } from '~/core/card/size';

/**
 * The card does not resize itself to what is in it.
 *
 * A box that grows with its content means the same word gets a different card
 * depending on where on the page it was read, and every streamed answer pushes
 * its own footer down the screen as it arrives. Fixing both dimensions costs a
 * roomy card for a two-word answer and buys a card that is in the same place,
 * at the same size, every time — with the original and the translation each
 * scrolling inside their own half. How big that box is comes from settings; see
 * `~/core/card/size`.
 */

export interface CardVerticalLayout {
  /** Document-space top for the card (the shadow host is position:absolute). */
  top: number;
  /** The card's height. Fixed, unless the window is too short to hold it. */
  height: number;
}

const MARGIN = 8;
const ICON_GAP = 2;

/**
 * Vertical placement for the TranslationCard.
 *
 * The card drops below the trigger icon where there is room, and goes above the
 * icon where there is not — a selection near the foot of the window is the
 * common case, not an edge one, and the alternative is a card squeezed into
 * whatever is left, which is how the height stopped being predictable. Where
 * neither side fits it sits against the bottom edge and overlaps the selection,
 * because being readable beats being out of the way.
 *
 * Reads window.innerHeight / scrollY (same convention as computeIconPosition);
 * the returned `top` is document-space.
 */
export function computeCardVerticalLayout(rect: DOMRect, wanted: number): CardVerticalLayout {
  const { innerHeight, scrollY } = window;
  const iconPos = computeIconPosition(rect);
  const iconTopVp = iconPos.top - scrollY;
  const iconBottomVp = iconTopVp + ICON_SIZE;

  // A window shorter than the card gets as much as fits; the panes inside take
  // care of the rest.
  const height = Math.min(wanted, innerHeight - 2 * MARGIN);

  const below = iconBottomVp + ICON_GAP;
  const above = iconTopVp - ICON_GAP - height;

  let topVp: number;
  if (below + height <= innerHeight - MARGIN) topVp = below;
  else if (above >= MARGIN) topVp = above;
  else topVp = innerHeight - MARGIN - height;

  if (topVp < MARGIN) topVp = MARGIN;
  return { top: topVp + scrollY, height };
}

/** Enough of a dragged card must stay on screen to grab it again. */
const KEEP_VISIBLE = 48;

export interface CardBasePosition {
  /** Document-space left/top the card opens at. */
  left: number;
  top: number;
  height: number;
}

/**
 * Where a card for this selection opens, in document space.
 *
 * Worth computing once and holding on to: it reads the current scroll, and the
 * viewport clamp inside `computeCardVerticalLayout` means the answer moves as
 * the page scrolls. Recomputing it per render would drift the card whenever
 * anything else caused a render mid-scroll.
 */
export function computeCardBasePosition(rect: DOMRect, size: CardSize): CardBasePosition {
  const iconPos = computeIconPosition(rect);
  let left = iconPos.left + ICON_SIZE - size.width;
  const minLeft = window.scrollX + MARGIN / 2;
  const maxLeft = window.scrollX + window.innerWidth - size.width - MARGIN / 2;
  if (left < minLeft) left = minLeft;
  if (left > maxLeft) left = maxLeft;
  const { top, height } = computeCardVerticalLayout(rect, size.height);
  return { left, top, height };
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
